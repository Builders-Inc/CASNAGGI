"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from . import db
from .config import get_settings
from .routers import (
    auth,
    events_admin,
    events_public,
    health,
    messages_admin,
    messages_public,
    uploads,
)
from .services import email

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    for warning in settings.validate():
        logger.warning(warning)

    await db.connect()
    logger.info(
        "Connected to MongoDB database %r (environment=%s)",
        settings.db_name,
        settings.environment,
    )

    # One shared client for Resend and Cloudinary; per-request clients leak
    # connections.
    client = httpx.AsyncClient()
    email.set_client(client)

    try:
        yield
    finally:
        await client.aclose()
        email.set_client(None)
        await db.disconnect()
        logger.info("Shutdown complete")


app = FastAPI(
    title="CASNAGGI API",
    version="1.0.0",
    lifespan=lifespan,
)

_settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_settings.cors_origins),
    # Bearer tokens, never cookies. allow_credentials=True cannot be combined
    # with a wildcard origin -- browsers reject the response outright -- and
    # leaving it off keeps a permissive CORS_ORIGINS from silently breaking
    # every admin request.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    health.router,
    auth.router,
    events_public.router,
    messages_public.router,
    events_admin.router,
    messages_admin.router,
    uploads.router,
):
    app.include_router(router)
