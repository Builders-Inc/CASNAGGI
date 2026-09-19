"""Shared model configuration and helpers."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ApiModel(BaseModel):
    """Base for every model crossing the API boundary.

    extra="ignore" lets documents straight from MongoDB (which carry _id) parse
    without a projection on every query.
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True, str_strip_whitespace=True)
