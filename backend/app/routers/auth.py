"""Admin login."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from .. import rate_limit
from ..config import Settings, get_settings
from ..models import LoginRequest, TokenResponse
from ..security import authenticate_admin, create_access_token, get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["auth"])

LOGIN_LIMIT = 5
LOGIN_WINDOW_SECONDS = 15 * 60


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    ip = rate_limit.client_ip(request)
    rate_limit.enforce(
        f"login:{ip}", limit=LOGIN_LIMIT, window_seconds=LOGIN_WINDOW_SECONDS
    )

    if not settings.admin_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Admin access is not configured on the server. Set ADMIN_USERNAME, "
                "ADMIN_PASSWORD_HASH and JWT_SECRET."
            ),
        )

    username = authenticate_admin(payload.username, payload.password, settings)
    if username is None:
        logger.warning("Failed admin login attempt from %s", ip)
        # Deliberately generic: never reveal whether the username exists.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token, expires_in = create_access_token(username, settings)
    logger.info("Admin %r signed in from %s", username, ip)
    return TokenResponse(access_token=token, expires_in=expires_in, username=username)


@router.get("/me")
async def me(current_admin: str = Depends(get_current_admin)) -> dict[str, str]:
    """Lets the frontend confirm a stored token is still valid on boot."""
    return {"username": current_admin, "role": "admin"}
