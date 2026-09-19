"""Cloudinary upload authorisation.

Issues a short-lived signature; the browser then uploads straight to Cloudinary.
No image bytes ever reach this API.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from ..config import Settings, get_settings
from ..security import get_current_admin
from ..services.cloudinary import signed_upload_params

router = APIRouter(
    prefix="/api/admin/uploads",
    tags=["admin:uploads"],
    dependencies=[Depends(get_current_admin)],
)


@router.post("/signature")
async def create_upload_signature(
    settings: Settings = Depends(get_settings),
) -> dict[str, str | int]:
    if not settings.cloudinary_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or paste an image URL instead."
            ),
        )
    return signed_upload_params(settings)
