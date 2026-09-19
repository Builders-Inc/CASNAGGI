"""Authenticated contact-message inbox."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..config import Settings, get_settings
from ..db import get_db
from ..models import MessageListResponse, MessageOut, MessagePatch
from ..security import get_current_admin
from ..services.email import send_contact_notification

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/messages",
    tags=["admin:messages"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=MessageListResponse)
async def list_messages(
    read: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> MessageListResponse:
    query: dict = {} if read is None else {"read": read}

    cursor = db.messages.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit)
    items = [MessageOut.model_validate(doc) async for doc in cursor]

    return MessageListResponse(
        items=items,
        total=await db.messages.count_documents(query),
        unreadCount=await db.messages.count_documents({"read": False}),
    )


@router.get("/{message_id}", response_model=MessageOut)
async def get_message(
    message_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> MessageOut:
    doc = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return MessageOut.model_validate(doc)


@router.patch("/{message_id}", response_model=MessageOut)
async def patch_message(
    message_id: str,
    payload: MessagePatch,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> MessageOut:
    """Supports marking unread again, not just read."""
    result = await db.messages.find_one_and_update(
        {"id": message_id},
        {"$set": {"read": payload.read}},
        projection={"_id": 0},
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return MessageOut.model_validate(result)


@router.post("/{message_id}/resend", response_model=MessageOut)
async def resend_notification(
    message_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MessageOut:
    """Retry a notification that failed.

    Closes the loop on an expired API key: the inbox flags the failure and this
    resends once it is fixed, without the visitor having to submit again.
    """
    doc = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    sent, error = await send_contact_notification(doc, settings)
    await db.messages.update_one(
        {"id": message_id}, {"$set": {"emailNotified": sent, "emailError": error}}
    )
    doc.update(emailNotified=sent, emailError=error)
    return MessageOut.model_validate(doc)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> Response:
    result = await db.messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    logger.info("Message %s deleted", message_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
