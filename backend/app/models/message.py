"""Contact form submission models."""

from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from .common import ApiModel, new_id, utcnow

# Mirrors the select options in frontend/src/pages/Contact.jsx. Unrecognised
# values fall back to "Other" rather than raising, so a copy change on the
# frontend can never start rejecting real submissions.
KNOWN_ROLES = {
    "Donor / funder",
    "Partner organization",
    "Volunteer",
    "Media / journalist",
    "Community member",
    "Other",
}


class MessageCreate(ApiModel):
    firstName: str = Field(min_length=1, max_length=80)
    lastName: str = Field(default="", max_length=80)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    role: str = Field(default="Other", max_length=60)
    message: str = Field(min_length=10, max_length=5000)

    # Honeypot. Rendered off-screen and aria-hidden, so a human never fills it.
    # A non-empty value means a bot, and the endpoint reports success without
    # storing anything.
    website: str = Field(default="", max_length=200)
    # Millisecond epoch recorded when the form mounted, used to reject
    # submissions completed implausibly fast.
    pageRenderedAt: int | None = None

    @field_validator("role")
    @classmethod
    def _normalise_role(cls, value: str) -> str:
        return value if value in KNOWN_ROLES else "Other"


class MessageOut(ApiModel):
    id: str = Field(default_factory=new_id)
    firstName: str
    lastName: str = ""
    email: str
    phone: str = ""
    role: str = "Other"
    message: str
    read: bool = False
    createdAt: datetime = Field(default_factory=utcnow)
    # Whether the Resend notification went out. Surfaced in the inbox so a
    # broken API key is discovered from the UI rather than from silence.
    emailNotified: bool = False
    emailError: str | None = None


class MessageListResponse(ApiModel):
    items: list[MessageOut]
    total: int
    unreadCount: int


class MessagePatch(ApiModel):
    read: bool


class MessageCreateResponse(ApiModel):
    """Deliberately uniform.

    A honeypot rejection returns exactly this, so a bot gets no signal that it
    was detected and nothing to adapt against.
    """

    status: Literal["received"] = "received"
