"""Public, unauthenticated event reads. Published events only."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..models import EventDetailResponse, EventListResponse, UpcomingResponse
from ..services import events as events_service

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=EventListResponse)
async def list_events(
    status_filter: str = Query("past", alias="status", pattern="^(past|upcoming|all)$"),
    category: str | None = Query(None, max_length=60),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> EventListResponse:
    """Defaults to past events, which keeps /events an archive of field reports.

    Upcoming events surface through the floating teaser and their own strip
    instead, so a future-dated event cannot displace the latest report from the
    featured slot.
    """
    published = await events_service.fetch_published(db)

    # Categories come from the full published set, not the filtered view, so
    # the filter chips stay stable whichever filter is active.
    categories = events_service.categories_of(published)

    items = published
    if status_filter != "all":
        items = [event for event in items if event.status == status_filter]
    if category:
        items = [event for event in items if event.category == category]

    return EventListResponse(items=items, total=len(items), categories=categories)


@router.get("/upcoming", response_model=UpcomingResponse)
async def upcoming_event(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UpcomingResponse:
    """The nearest future event, or null.

    Always 200 so the floating button can hide itself without logging a 404 on
    every homepage load.
    """
    today = datetime.now(timezone.utc).date().isoformat()
    doc = await db.events.find_one(
        {"published": True, "date": {"$gte": today}},
        {"_id": 0},
        sort=[("date", 1)],
    )
    return UpcomingResponse(event=events_service.from_document(doc) if doc else None)


@router.get("/{slug}", response_model=EventDetailResponse)
async def get_event(
    slug: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> EventDetailResponse:
    """One event plus its neighbours.

    Resolving prev/next/related here means the detail page needs a single
    request rather than also downloading the full archive.
    """
    published = await events_service.fetch_published(db)
    event = next((item for item in published if item.slug == slug), None)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    prev_event, next_event, related = events_service.neighbours(published, slug)
    return EventDetailResponse(
        event=event, prev=prev_event, next=next_event, related=related
    )
