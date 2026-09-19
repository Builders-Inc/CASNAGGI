"""Seed the events collection from the original site content.

Run once against a fresh database:

    docker compose exec api python -m app.scripts.seed_events
    docker compose exec api python -m app.scripts.seed_events --force
    docker compose exec api python -m app.scripts.seed_events --upload-images

Deliberately a one-shot script rather than an automatic startup seed: a startup
seed would resurrect events an admin had deliberately deleted, every time the
container restarted.

Idempotent -- events are matched on `slug`, so re-running skips what already
exists (or overwrites it with --force). The source data is seed_events.json,
generated from frontend/src/data/content.js so the two cannot drift.
"""

import argparse
import asyncio
import json
import logging
import sys
from datetime import date
from pathlib import Path

import httpx
from motor.motor_asyncio import AsyncIOMotorClient

from ..config import get_settings
from ..models.common import new_id, utcnow
from ..services.cloudinary import UPLOAD_URL_TEMPLATE, build_signature

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed")

DATA_FILE = Path(__file__).parent / "seed_events.json"


async def upload_remote_image(url: str, settings, client: httpx.AsyncClient) -> tuple[str, str]:
    """Hand Cloudinary a remote URL and let it fetch the file itself.

    Saves downloading each image locally just to upload it again.
    """
    import time

    timestamp = int(time.time())
    signed = {"folder": settings.cloudinary_folder, "timestamp": timestamp}
    signature = build_signature(signed, settings.cloudinary_api_secret)

    response = await client.post(
        UPLOAD_URL_TEMPLATE.format(cloud_name=settings.cloudinary_cloud_name),
        data={
            "file": url,
            "folder": settings.cloudinary_folder,
            "timestamp": timestamp,
            "api_key": settings.cloudinary_api_key,
            "signature": signature,
        },
        timeout=60.0,
    )
    response.raise_for_status()
    body = response.json()
    return body["secure_url"], body["public_id"]


async def seed(force: bool, upload_images: bool) -> int:
    settings = get_settings()
    settings.validate()

    if upload_images and not settings.cloudinary_configured:
        logger.error("--upload-images needs CLOUDINARY_* to be set. Aborting.")
        return 1

    events = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    logger.info("Loaded %d events from %s", len(events), DATA_FILE.name)

    client = AsyncIOMotorClient(settings.mongo_url, tz_aware=True)
    db = client[settings.db_name]
    http = httpx.AsyncClient() if upload_images else None

    created = updated = skipped = 0
    try:
        for entry in events:
            existing = await db.events.find_one({"slug": entry["slug"]}, {"_id": 0, "id": 1})
            if existing and not force:
                skipped += 1
                continue

            doc = dict(entry)
            doc["published"] = True
            doc["imagePublicId"] = None
            doc["stats"] = [dict(stat) for stat in entry["stats"]]
            # Validate the date early so a typo fails here, not at read time.
            date.fromisoformat(doc["date"])
            doc["updatedAt"] = utcnow()

            if upload_images and http is not None:
                try:
                    secure_url, public_id = await upload_remote_image(
                        entry["image"], settings, http
                    )
                    doc["image"], doc["imagePublicId"] = secure_url, public_id
                    logger.info("  uploaded image for %s", entry["slug"])
                except (httpx.HTTPError, KeyError) as exc:
                    # Keep the original URL rather than failing the whole seed.
                    logger.warning("  image upload failed for %s: %s", entry["slug"], exc)

            if existing:
                await db.events.update_one({"slug": entry["slug"]}, {"$set": doc})
                updated += 1
            else:
                doc["id"] = new_id()
                doc["createdAt"] = utcnow()
                await db.events.insert_one(doc)
                created += 1

        total = await db.events.count_documents({})
        logger.info(
            "Done. created=%d updated=%d skipped=%d | %d events in the database",
            created,
            updated,
            skipped,
            total,
        )
        if skipped:
            logger.info("Re-run with --force to overwrite the events that already exist.")
    finally:
        if http is not None:
            await http.aclose()
        client.close()

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed the events collection.")
    parser.add_argument(
        "--force", action="store_true", help="Overwrite events that already exist."
    )
    parser.add_argument(
        "--upload-images",
        action="store_true",
        help="Copy each image into Cloudinary instead of keeping the original URL.",
    )
    args = parser.parse_args()
    return asyncio.run(seed(args.force, args.upload_images))


if __name__ == "__main__":
    sys.exit(main())
