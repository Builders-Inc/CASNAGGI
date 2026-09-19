"""Slug generation and uniqueness."""

import re
import unicodedata

from motor.motor_asyncio import AsyncIOMotorDatabase

MAX_SLUG_LENGTH = 120


def slugify(text: str, max_length: int = MAX_SLUG_LENGTH) -> str:
    """Lowercase, ASCII-folded, hyphen-separated."""
    folded = unicodedata.normalize("NFKD", text)
    ascii_text = folded.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower())
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug[:max_length].strip("-")


async def unique_slug(
    db: AsyncIOMotorDatabase,
    base: str,
    *,
    exclude_id: str | None = None,
) -> str:
    """Append -2, -3, ... until the slug is free.

    Generation and insertion are not atomic, so the unique index on `slug`
    remains the real guarantee; callers must still handle DuplicateKeyError.
    """
    candidate = base or "event"
    suffix = 1
    while True:
        query: dict = {"slug": candidate}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        if await db.events.find_one(query, {"_id": 1}) is None:
            return candidate
        suffix += 1
        tail = f"-{suffix}"
        candidate = f"{base[: MAX_SLUG_LENGTH - len(tail)]}{tail}"
