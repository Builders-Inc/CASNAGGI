"""Event persistence helpers.

Ordering lives here so the public list, the detail neighbours and the admin list
can never drift apart. Events sort newest-first, which the frontend depends on
more than it looks: the featured card on /events is simply the first item.

`date` is stored as an ISO "YYYY-MM-DD" string rather than a BSON datetime.
BSON has no date-only type, so a datetime would invite timezone drift around
midnight, while ISO strings in this format sort lexicographically exactly as
they sort chronologically.
"""

from datetime import date as date_type

from motor.motor_asyncio import AsyncIOMotorDatabase

from ..models import EventCreate, EventOut, EventUpdate
from ..models.common import new_id, utcnow
from .dates import derive_label

SORT_NEWEST_FIRST = [("date", -1), ("createdAt", -1)]


def to_document(payload: EventCreate | EventUpdate, *, slug: str | None = None) -> dict:
    """Model to MongoDB document. Unset fields are omitted (PATCH semantics)."""
    doc = payload.model_dump(exclude_unset=True, exclude_none=True)
    doc.pop("slug", None)

    if isinstance(doc.get("date"), date_type):
        doc["date"] = doc["date"].isoformat()
    if "stats" in doc:
        doc["stats"] = [dict(stat) for stat in doc["stats"]]
    if slug is not None:
        doc["slug"] = slug

    # An empty label means "use the derived one", so an admin who clears the
    # field gets the automatic value back rather than a blank heading.
    if doc.get("dateLabel") == "" and doc.get("date"):
        doc["dateLabel"] = derive_label(date_type.fromisoformat(doc["date"]))

    doc["updatedAt"] = utcnow()
    return doc


def new_document(payload: EventCreate, slug: str) -> dict:
    doc = to_document(payload, slug=slug)
    doc.setdefault("dateLabel", derive_label(payload.date))
    doc["id"] = new_id()
    doc["createdAt"] = utcnow()
    return doc


def from_document(doc: dict) -> EventOut:
    return EventOut.model_validate(doc)


async def fetch_published(db: AsyncIOMotorDatabase) -> list[EventOut]:
    """Every published event, newest first.

    Returning the whole set is deliberate at this scale (tens of events): it
    keeps the featured-item and prev/next semantics identical to the original
    static array, and the payload stays small.
    """
    cursor = db.events.find({"published": True}, {"_id": 0}).sort(SORT_NEWEST_FIRST)
    return [from_document(doc) async for doc in cursor]


async def fetch_all(db: AsyncIOMotorDatabase) -> list[EventOut]:
    """Published and drafts, for the admin list."""
    cursor = db.events.find({}, {"_id": 0}).sort(SORT_NEWEST_FIRST)
    return [from_document(doc) async for doc in cursor]


async def find_by_id(db: AsyncIOMotorDatabase, event_id: str) -> EventOut | None:
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    return from_document(doc) if doc else None


def neighbours(
    events: list[EventOut], slug: str
) -> tuple[EventOut | None, EventOut | None, list[EventOut]]:
    """Previous, next and related, matching the original client-side behaviour.

    Previous and next wrap around the list; related puts same-category events
    first, then everything else, capped at three.
    """
    index = next((i for i, event in enumerate(events) if event.slug == slug), None)
    if index is None:
        return None, None, []

    count = len(events)
    prev_event = events[(index - 1) % count] if count > 1 else None
    next_event = events[(index + 1) % count] if count > 1 else None

    current = events[index]
    same = [e for e in events if e.slug != slug and e.category == current.category]
    other = [e for e in events if e.slug != slug and e.category != current.category]
    return prev_event, next_event, [*same, *other][:3]


def categories_of(events: list[EventOut]) -> list[str]:
    """Preserves first-seen order, which is newest-first."""
    seen: dict[str, None] = {}
    for event in events:
        seen.setdefault(event.category, None)
    return list(seen)
