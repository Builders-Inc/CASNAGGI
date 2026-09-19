"""Event models.

Field names are camelCase to match what the existing React components already
read; renaming them would mean touching every template in Events.jsx and
EventDetail.jsx for no benefit.
"""

from datetime import date as date_type
from datetime import datetime, timezone
from typing import Literal

from pydantic import Field, computed_field, field_validator

from .common import ApiModel, new_id, utcnow

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class Stat(ApiModel):
    value: str = Field(min_length=1, max_length=20)
    label: str = Field(min_length=1, max_length=120)


class EventBase(ApiModel):
    title: str = Field(min_length=1, max_length=200)
    date: date_type
    # Stored rather than derived: the existing entries use month granularity
    # ("January 2026") that does not match their exact dates, and admins will
    # want forms like "15-17 March 2026" for multi-day events. The API fills
    # this from `date` when it is left blank.
    dateLabel: str = Field(default="", max_length=80)
    category: str = Field(min_length=1, max_length=60)
    location: str = Field(min_length=1, max_length=160)
    excerpt: str = Field(min_length=1, max_length=600)
    image: str = Field(min_length=1, max_length=1000)
    imagePublicId: str | None = Field(default=None, max_length=300)
    # At least one tag is required: Events.jsx maps over tags and
    # EventDetail.jsx joins them, both unguarded, so an untagged event would
    # be a white-screen crash rather than a cosmetic gap.
    tags: list[str] = Field(default_factory=list, min_length=1, max_length=12)
    story: list[str] = Field(default_factory=list, max_length=20)
    stats: list[Stat] = Field(default_factory=list, max_length=6)
    published: bool = False

    @field_validator("tags")
    @classmethod
    def _clean_tags(cls, value: list[str]) -> list[str]:
        cleaned = [tag.strip() for tag in value if tag and tag.strip()]
        if not cleaned:
            raise ValueError("At least one tag is required.")
        if any(len(tag) > 40 for tag in cleaned):
            raise ValueError("Each tag must be 40 characters or fewer.")
        return cleaned

    @field_validator("story")
    @classmethod
    def _clean_story(cls, value: list[str]) -> list[str]:
        cleaned = [para.strip() for para in value if para and para.strip()]
        if any(len(para) > 5000 for para in cleaned):
            raise ValueError("Each paragraph must be 5000 characters or fewer.")
        return cleaned


class EventCreate(EventBase):
    # Optional: derived from the title and made unique when omitted.
    slug: str | None = Field(default=None, pattern=SLUG_PATTERN, max_length=120)


class EventUpdate(ApiModel):
    """PATCH semantics: every field optional, only what is sent is changed."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, pattern=SLUG_PATTERN, max_length=120)
    date: date_type | None = None
    dateLabel: str | None = Field(default=None, max_length=80)
    category: str | None = Field(default=None, min_length=1, max_length=60)
    location: str | None = Field(default=None, min_length=1, max_length=160)
    excerpt: str | None = Field(default=None, min_length=1, max_length=600)
    image: str | None = Field(default=None, min_length=1, max_length=1000)
    imagePublicId: str | None = Field(default=None, max_length=300)
    tags: list[str] | None = Field(default=None, min_length=1, max_length=12)
    story: list[str] | None = Field(default=None, max_length=20)
    stats: list[Stat] | None = Field(default=None, max_length=6)
    published: bool | None = None


class EventOut(EventBase):
    id: str = Field(default_factory=new_id)
    slug: str = Field(pattern=SLUG_PATTERN, max_length=120)
    createdAt: datetime = Field(default_factory=utcnow)
    updatedAt: datetime = Field(default_factory=utcnow)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def status(self) -> Literal["upcoming", "past"]:
        """Derived from `date`, never stored.

        One source of truth, so there is no background job to flip events over
        and no chance of a stale flag. Evaluated in UTC; Nigeria is UTC+1, so an
        event dated today reads as upcoming until 01:00 local the next day.
        """
        today = datetime.now(timezone.utc).date()
        return "upcoming" if self.date >= today else "past"


class EventListResponse(ApiModel):
    items: list[EventOut]
    total: int
    # Computed across all published events, not just this page, so the filter
    # chips on /events do not disappear as you paginate.
    categories: list[str] = Field(default_factory=list)


class EventDetailResponse(ApiModel):
    """Neighbours resolved server-side so the detail page needs one request.

    This preserves the original client behaviour exactly: prev/next wrap around
    the date-descending list, and related is same-category first then others,
    capped at three.
    """

    event: EventOut
    prev: EventOut | None = None
    next: EventOut | None = None
    related: list[EventOut] = Field(default_factory=list)


class UpcomingResponse(ApiModel):
    """Returns 200 with a null event rather than 404.

    The floating teaser button hides itself when there is nothing upcoming, and
    a 404 would put noise in the browser console on every homepage load.
    """

    event: EventOut | None = None
