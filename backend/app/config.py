"""Settings read from the environment.

Everything is read lazily through get_settings() rather than at import time, so
the modules stay importable in tests without a fully populated environment.
Missing required values raise a readable error from validate(), which runs
during application startup.
"""

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent

# Present for local development; inside the container the values arrive via
# Compose's env_file and .env is excluded by .dockerignore.
load_dotenv(ROOT_DIR / ".env")


def _csv(name: str, default: str = "") -> tuple[str, ...]:
    raw = os.environ.get(name, default)
    return tuple(part.strip() for part in raw.split(",") if part.strip())


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


class ConfigError(RuntimeError):
    """Raised at startup when required configuration is missing."""


@dataclass(frozen=True)
class Settings:
    mongo_url: str
    db_name: str
    cors_origins: tuple[str, ...]

    jwt_secret: str
    jwt_algorithm: str
    jwt_expire_minutes: int
    admin_username: str
    admin_password_hash: str

    resend_api_key: str
    resend_from: str
    notify_to: tuple[str, ...]

    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    cloudinary_folder: str

    environment: str

    @property
    def admin_configured(self) -> bool:
        """Whether admin login can work at all."""
        return bool(self.admin_username and self.admin_password_hash and self.jwt_secret)

    @property
    def email_configured(self) -> bool:
        return bool(self.resend_api_key and self.resend_from and self.notify_to)

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.cloudinary_cloud_name
            and self.cloudinary_api_key
            and self.cloudinary_api_secret
        )

    def validate(self) -> list[str]:
        """Return a list of non-fatal warnings; raise on anything fatal."""
        if not self.mongo_url:
            raise ConfigError("MONGO_URL is not set. Copy backend/.env.example to backend/.env.")
        if not self.db_name:
            raise ConfigError("DB_NAME is not set.")

        warnings: list[str] = []
        if "*" in self.cors_origins:
            warnings.append(
                "CORS_ORIGINS is '*'. Set it to the exact frontend origin in production."
            )
        if not self.admin_configured:
            warnings.append(
                "Admin auth is not configured (ADMIN_USERNAME / ADMIN_PASSWORD_HASH / "
                "JWT_SECRET). The admin login endpoint will return 503."
            )
        if not self.email_configured:
            warnings.append(
                "Resend is not configured. Contact messages will still be stored, but no "
                "notification email will be sent."
            )
        if not self.cloudinary_configured:
            warnings.append(
                "Cloudinary is not configured. Image uploads will be unavailable; events "
                "can still reference pasted image URLs."
            )
        return warnings


@lru_cache
def get_settings() -> Settings:
    return Settings(
        mongo_url=os.environ.get("MONGO_URL", ""),
        db_name=os.environ.get("DB_NAME", "casnaggi"),
        cors_origins=_csv("CORS_ORIGINS", "http://localhost:3000"),
        jwt_secret=os.environ.get("JWT_SECRET", ""),
        jwt_algorithm=os.environ.get("JWT_ALGORITHM", "HS256"),
        jwt_expire_minutes=_int("JWT_EXPIRE_MINUTES", 480),
        admin_username=os.environ.get("ADMIN_USERNAME", ""),
        admin_password_hash=os.environ.get("ADMIN_PASSWORD_HASH", ""),
        resend_api_key=os.environ.get("RESEND_API_KEY", ""),
        resend_from=os.environ.get("RESEND_FROM", ""),
        notify_to=_csv("NOTIFY_TO"),
        cloudinary_cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
        cloudinary_api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
        cloudinary_api_secret=os.environ.get("CLOUDINARY_API_SECRET", ""),
        cloudinary_folder=os.environ.get("CLOUDINARY_FOLDER", "casnaggi/events"),
        environment=os.environ.get("ENVIRONMENT", "production"),
    )
