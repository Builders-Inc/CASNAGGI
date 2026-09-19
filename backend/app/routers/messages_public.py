"""Public contact form endpoint."""

import hashlib
import logging
import time

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from .. import rate_limit
from ..config import Settings, get_settings
from ..db import get_db
from ..models import MessageCreate, MessageCreateResponse, MessageOut
from ..services.email import send_contact_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messages", tags=["messages"])

SUBMIT_LIMIT = 5
SUBMIT_WINDOW_SECONDS = 10 * 60
GLOBAL_LIMIT = 60
GLOBAL_WINDOW_SECONDS = 60 * 60
MIN_FILL_SECONDS = 2.5


def _hash_ip(ip: str, secret: str) -> str:
    """Store a salted digest rather than the address itself.

    Enough to spot one abusive source across submissions, without keeping
    personal data we have no need for.
    """
    return hashlib.sha256(f"{ip}{secret}".encode("utf-8")).hexdigest()[:32]


async def _notify(message: dict, settings: Settings, db: AsyncIOMotorDatabase) -> None:
    sent, error = await send_contact_notification(message, settings)
    await db.messages.update_one(
        {"id": message["id"]},
        {"$set": {"emailNotified": sent, "emailError": error}},
    )
    if not sent:
        logger.warning("Contact notification not sent for %s: %s", message["id"], error)


@router.post("", response_model=MessageCreateResponse, status_code=201)
async def create_message(
    payload: MessageCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MessageCreateResponse:
    ip = rate_limit.client_ip(request)
    rate_limit.enforce(
        f"contact:{ip}", limit=SUBMIT_LIMIT, window_seconds=SUBMIT_WINDOW_SECONDS
    )
    rate_limit.enforce(
        "contact:global", limit=GLOBAL_LIMIT, window_seconds=GLOBAL_WINDOW_SECONDS
    )

    # Bot signals. Both report success and store nothing: telling a bot it was
    # detected only teaches it what to change.
    if payload.website.strip():
        logger.info("Honeypot triggered from %s", ip)
        return MessageCreateResponse()

    if payload.pageRenderedAt:
        elapsed = time.time() - (payload.pageRenderedAt / 1000)
        if 0 <= elapsed < MIN_FILL_SECONDS:
            logger.info("Submission too fast (%.2fs) from %s", elapsed, ip)
            return MessageCreateResponse()

    message = MessageOut(
        firstName=payload.firstName,
        lastName=payload.lastName,
        email=payload.email,
        phone=payload.phone,
        role=payload.role,
        message=payload.message,
    )
    doc = message.model_dump()
    doc["ipHash"] = _hash_ip(ip, settings.jwt_secret or settings.db_name)
    doc["userAgent"] = request.headers.get("user-agent", "")[:300]

    # Persist first, acknowledge second, notify third. The visitor never waits
    # on Resend, and a mail failure can delay the notification but never lose
    # the message.
    await db.messages.insert_one(doc)
    background_tasks.add_task(_notify, doc, settings, db)

    logger.info("Contact message %s stored", message.id)
    return MessageCreateResponse()
