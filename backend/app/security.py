"""Admin authentication: password verification and JWT bearer tokens.

There is a single admin account, provisioned through ADMIN_USERNAME and a bcrypt
ADMIN_PASSWORD_HASH. Everything that knows about that lives in authenticate_admin
below, so moving to a users collection later touches one function and leaves the
token format, the dependency and the whole frontend untouched.

Bearer tokens rather than cookies: the admin SPA is served from a different
origin than the API, and cookie auth would require allow_credentials, which
cannot be combined with a wildcard CORS origin.
"""

import hmac
import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, get_settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        # Malformed hash in the environment; treat as a failed login rather than
        # a 500, and make the cause visible in the logs.
        logger.exception("ADMIN_PASSWORD_HASH is not a valid bcrypt hash")
        return False


def authenticate_admin(username: str, password: str, settings: Settings) -> str | None:
    """Return the username on success, None on failure.

    The single place that knows authentication is env-var backed.
    """
    # compare_digest on both halves so a wrong username costs the same as a
    # wrong password and cannot be distinguished by timing.
    user_ok = hmac.compare_digest(username, settings.admin_username)
    pass_ok = verify_password(password, settings.admin_password_hash)
    return settings.admin_username if (user_ok and pass_ok) else None


def create_access_token(subject: str, settings: Settings) -> tuple[str, int]:
    """Return (token, expires_in_seconds)."""
    expires_in = settings.jwt_expire_minutes * 60
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": "admin",
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_in


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> str:
    """Guard for admin routes. Applied at router level so no endpoint can ship open."""
    if credentials is None or not credentials.credentials:
        raise CREDENTIALS_EXCEPTION
    if not settings.admin_configured:
        raise CREDENTIALS_EXCEPTION

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except jwt.InvalidTokenError:
        raise CREDENTIALS_EXCEPTION from None

    subject = payload.get("sub")
    if not subject or payload.get("role") != "admin":
        raise CREDENTIALS_EXCEPTION
    return subject
