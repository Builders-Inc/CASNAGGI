"""MongoDB connection lifecycle and collection accessors.

The client is created during application startup rather than at import time, so
importing this module never requires a reachable database.
"""

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from .config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect() -> AsyncIOMotorDatabase:
    """Open the connection and ensure indexes. Called once from the lifespan."""
    global _client, _db

    settings = get_settings()
    # tz_aware keeps datetimes timezone-aware on the way back out; without it
    # pymongo returns naive UTC and comparisons against aware values fail.
    _client = AsyncIOMotorClient(settings.mongo_url, tz_aware=True)
    _db = _client[settings.db_name]

    await _ensure_indexes(_db)
    return _db


async def disconnect() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client, _db = None, None


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Idempotent: safe to run on every startup."""
    await db.events.create_index([("slug", ASCENDING)], unique=True, name="slug_unique")
    await db.events.create_index(
        [("published", ASCENDING), ("date", DESCENDING)], name="published_date"
    )
    await db.events.create_index([("date", DESCENDING)], name="date_desc")

    await db.messages.create_index([("createdAt", DESCENDING)], name="created_desc")
    await db.messages.create_index([("read", ASCENDING)], name="read_flag")
    logger.info("MongoDB indexes ensured")


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency. Raises if called before startup completed."""
    if _db is None:
        raise RuntimeError("Database is not connected; startup did not complete.")
    return _db


async def ping() -> bool:
    if _client is None:
        return False
    try:
        await _client.admin.command("ping")
        return True
    except Exception:  # noqa: BLE001 - health check must never raise
        logger.exception("MongoDB ping failed")
        return False
