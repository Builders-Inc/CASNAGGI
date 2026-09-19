"""Cloudinary upload signatures.

The browser uploads directly to Cloudinary; the API only authorises it. That
keeps image bytes off the VPS entirely (no worker held open by a 4 MB phone
photo, no body-size tuning across Caddy and uvicorn, no python-multipart
dependency, no disk — the api service has no volume).

Only cloud_name, api_key and a short-lived signature reach the browser. Those
are public identifiers. CLOUDINARY_API_SECRET never leaves the server, and the
endpoint issuing signatures sits behind admin auth, so only a signed-in admin
can obtain an upload authorisation.
"""

import hashlib
import time

from ..config import Settings

UPLOAD_URL_TEMPLATE = "https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
DESTROY_URL_TEMPLATE = "https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy"


def build_signature(params: dict[str, str | int], api_secret: str) -> str:
    """Cloudinary's scheme: sha1 of the sorted param string plus the secret."""
    payload = "&".join(f"{key}={params[key]}" for key in sorted(params))
    return hashlib.sha1(f"{payload}{api_secret}".encode("utf-8")).hexdigest()  # noqa: S324


def signed_upload_params(settings: Settings) -> dict[str, str | int]:
    """Everything the browser needs for one signed upload.

    Only `folder` and `timestamp` are signed, which constrains uploads to the
    configured folder; Cloudinary rejects any signed request carrying extra
    parameters that were not part of the signature.
    """
    timestamp = int(time.time())
    signed = {"folder": settings.cloudinary_folder, "timestamp": timestamp}
    signature = build_signature(signed, settings.cloudinary_api_secret)

    return {
        "cloudName": settings.cloudinary_cloud_name,
        "apiKey": settings.cloudinary_api_key,
        "timestamp": timestamp,
        "folder": settings.cloudinary_folder,
        "signature": signature,
        "uploadUrl": UPLOAD_URL_TEMPLATE.format(cloud_name=settings.cloudinary_cloud_name),
    }


def signed_destroy_params(public_id: str, settings: Settings) -> tuple[str, dict[str, str | int]]:
    """URL and form fields for deleting one asset."""
    timestamp = int(time.time())
    signed = {"public_id": public_id, "timestamp": timestamp}
    signature = build_signature(signed, settings.cloudinary_api_secret)

    url = DESTROY_URL_TEMPLATE.format(cloud_name=settings.cloudinary_cloud_name)
    return url, {
        "public_id": public_id,
        "timestamp": timestamp,
        "api_key": settings.cloudinary_api_key,
        "signature": signature,
    }
