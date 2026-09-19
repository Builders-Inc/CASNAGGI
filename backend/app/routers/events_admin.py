"""Authenticated event management.

The guard is declared on the router rather than per-endpoint, so a route added
here later cannot ship unauthenticated by accident.
"""

import logging

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from ..config import Settings, get_settings
from ..db import get_db
from ..models import EventCreate, EventListResponse, EventOut, EventUpdate
from ..security import get_current_admin
from ..services import events as events_service
from ..services.cloudinary import signed_destroy_params
from ..services.email import get_client
from ..services.slugs import slugify, unique_slug

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/events",
    tags=["admin:events"],
    dependencies=[Depends(get_current_admin)],
)

SLUG_CONFLICT = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="An event with that slug already exists.",
)


@router.get("", response_model=EventListResponse)
async def list_events(db: AsyncIOMotorDatabase = Depends(get_db)) -> EventListResponse:
    """Includes drafts, unlike the public listing."""
    items = await events_service.fetch_all(db)
    return EventListResponse(
        items=items,
        total=len(items),
        categories=events_service.categories_of(items),
    )


@router.get("/{event_id}", response_model=EventOut)
async def get_event(
    event_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> EventOut:
    event = await events_service.find_by_id(db, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate, db: AsyncIOMotorDatabase = Depends(get_db)
) -> EventOut:
    base = payload.slug or slugify(payload.title)
    slug = await unique_slug(db, base)

    doc = events_service.new_document(payload, slug)
    try:
        await db.events.insert_one(doc)
    except DuplicateKeyError:
        # unique_slug and insert are not atomic; the index is the real guard.
        raise SLUG_CONFLICT from None

    logger.info("Event %s created (%s)", doc["id"], slug)
    return events_service.from_document(doc)


@router.patch("/{event_id}", response_model=EventOut)
async def update_event(
    event_id: str,
    payload: EventUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> EventOut:
    existing = await events_service.find_by_id(db, event_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    slug = None
    if payload.slug and payload.slug != existing.slug:
        slug = await unique_slug(db, slugify(payload.slug), exclude_id=event_id)

    update = events_service.to_document(payload, slug=slug)
    # createdAt is immutable and never taken from the client.
    update.pop("createdAt", None)
    update.pop("id", None)

    try:
        await db.events.update_one({"id": event_id}, {"$set": update})
    except DuplicateKeyError:
        raise SLUG_CONFLICT from None

    updated = await events_service.find_by_id(db, event_id)
    if updated is None:  # pragma: no cover - only if deleted mid-request
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    logger.info("Event %s updated", event_id)
    return updated


@router.post("/{event_id}/publish", response_model=EventOut)
async def set_published(
    event_id: str,
    published: bool = Body(embed=True),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> EventOut:
    """Quick toggle from the list row, without sending the whole document."""
    return await update_event(event_id, EventUpdate(published=published), db)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    delete_image: bool = Query(False, alias="deleteImage"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    event = await events_service.find_by_id(db, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    await db.events.delete_one({"id": event_id})

    # Opt-in: leaving the asset in place costs nothing and keeps an accidental
    # delete recoverable.
    if delete_image and event.imagePublicId and settings.cloudinary_configured:
        await _destroy_image(event.imagePublicId, settings)

    logger.info("Event %s deleted", event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


async def _destroy_image(public_id: str, settings: Settings) -> None:
    client = get_client()
    if client is None:
        return
    url, data = signed_destroy_params(public_id, settings)
    try:
        await client.post(url, data=data, timeout=15.0)
    except httpx.HTTPError as exc:
        # The event is already gone; an orphaned asset is not worth failing on.
        logger.warning("Could not delete Cloudinary asset %s: %s", public_id, exc)
