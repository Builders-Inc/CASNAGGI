"""Contact-form notifications via Resend.

One authenticated POST, so no SDK dependency. A single httpx client is created
during startup and reused; creating one per request leaks connections.

Email is a notification, never the system of record. The message is written to
MongoDB and acknowledged to the visitor before this runs, so a Resend outage or
an expired key can delay a notification but can never lose a message.
"""

import html
import logging

import httpx

from ..config import Settings

logger = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"

_client: httpx.AsyncClient | None = None


def set_client(client: httpx.AsyncClient | None) -> None:
    global _client
    _client = client


def get_client() -> httpx.AsyncClient | None:
    return _client


def _row(label: str, value: str) -> str:
    return (
        '<tr>'
        f'<td style="padding:6px 16px 6px 0;color:#636F67;font-size:13px;'
        f'white-space:nowrap;vertical-align:top">{html.escape(label)}</td>'
        f'<td style="padding:6px 0;color:#1B241E;font-size:14px">{html.escape(value)}</td>'
        '</tr>'
    )


def build_notification_html(message: dict) -> str:
    """Render the notification body.

    Every interpolated value is escaped: this content comes from an
    unauthenticated public form, and it lands in a mail client that renders
    HTML.
    """
    name = " ".join(
        part for part in [message.get("firstName", ""), message.get("lastName", "")] if part
    )
    rows = "".join(
        [
            _row("Name", name or "-"),
            _row("Email", message.get("email", "-")),
            _row("Phone", message.get("phone") or "-"),
            _row("Reaching out as", message.get("role") or "-"),
        ]
    )
    body = html.escape(message.get("message", "")).replace("\n", "<br>")

    return (
        '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;'
        'max-width:560px;margin:0 auto">'
        '<p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;'
        'color:#E05A47;margin:0 0 8px">CASNAGGI website</p>'
        '<h1 style="font-size:22px;color:#1B241E;margin:0 0 24px">New contact message</h1>'
        f'<table style="border-collapse:collapse;width:100%">{rows}</table>'
        '<div style="margin-top:24px;padding:20px;background:#F2F0E6;border-radius:12px;'
        'color:#1B241E;font-size:15px;line-height:1.6">'
        f'{body}</div>'
        '<p style="margin-top:24px;color:#636F67;font-size:13px">'
        'Reply to this email to respond to the sender directly.</p>'
        '</div>'
    )


async def send_contact_notification(message: dict, settings: Settings) -> tuple[bool, str | None]:
    """Return (sent, error). Never raises."""
    if not settings.email_configured:
        return False, "Resend is not configured"

    client = get_client()
    if client is None:
        return False, "HTTP client unavailable"

    name = " ".join(
        part for part in [message.get("firstName", ""), message.get("lastName", "")] if part
    )
    payload = {
        "from": settings.resend_from,
        "to": list(settings.notify_to),
        # Hitting Reply in the mail client answers the sender, not the website.
        "reply_to": message.get("email"),
        "subject": f"New contact message from {name or message.get('email', 'the website')}",
        "html": build_notification_html(message),
    }

    try:
        response = await client.post(
            RESEND_ENDPOINT,
            json=payload,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        logger.warning("Resend request failed: %s", exc)
        return False, f"Request failed: {exc.__class__.__name__}"

    if response.status_code >= 400:
        detail = response.text[:300]
        logger.warning("Resend rejected the message (%s): %s", response.status_code, detail)
        return False, f"HTTP {response.status_code}: {detail}"

    return True, None
