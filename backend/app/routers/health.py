"""Health and liveness endpoints."""

from fastapi import APIRouter

from .. import db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/")
async def root() -> dict[str, str]:
    return {"service": "CASNAGGI API", "status": "ok"}


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "db": "ok" if await db.ping() else "unavailable"}
