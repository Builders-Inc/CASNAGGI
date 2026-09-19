"""In-process sliding-window rate limiting.

Deliberately dependency-free: slowapi would pull in `limits` and a Redis-shaped
abstraction for what is a single-container deployment. The trade-off is that
counters reset when the container restarts and are not shared across replicas.
That is acceptable for one api service with one replica; if this ever scales
out, swap the backing store for Redis and keep the same interface.

Client IPs are only correct because uvicorn runs with --forwarded-allow-ips,
which lets it trust the X-Forwarded-For header Caddy sets. Without that every
visitor appears as the Docker bridge gateway and a single limiter entry would
throttle the whole internet.
"""

import time
from collections import deque

from fastapi import HTTPException, Request, status

# Cap the number of tracked keys so a flood of unique IPs cannot grow this
# without bound. Once full, the oldest-touched keys are evicted.
_MAX_KEYS = 10_000

_buckets: dict[str, deque[float]] = {}


def client_ip(request: Request) -> str:
    """Best-effort client address.

    request.client.host is already the real client when uvicorn is started with
    --forwarded-allow-ips; the explicit header read is a fallback for other
    deployments.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _evict_if_needed() -> None:
    if len(_buckets) <= _MAX_KEYS:
        return
    # Drop the entries whose most recent hit is oldest.
    surplus = len(_buckets) - _MAX_KEYS
    oldest = sorted(_buckets, key=lambda k: _buckets[k][-1] if _buckets[k] else 0.0)
    for key in oldest[:surplus]:
        _buckets.pop(key, None)


def hit(key: str, *, limit: int, window_seconds: int) -> int | None:
    """Record a hit. Returns None if allowed, or seconds to wait if over limit."""
    now = time.monotonic()
    bucket = _buckets.setdefault(key, deque())

    cutoff = now - window_seconds
    while bucket and bucket[0] < cutoff:
        bucket.popleft()

    if len(bucket) >= limit:
        retry_after = int(bucket[0] + window_seconds - now) + 1
        return max(retry_after, 1)

    bucket.append(now)
    _evict_if_needed()
    return None


def enforce(key: str, *, limit: int, window_seconds: int) -> None:
    """Raise 429 with Retry-After when the caller is over the limit."""
    retry_after = hit(key, limit=limit, window_seconds=window_seconds)
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again shortly.",
            headers={"Retry-After": str(retry_after)},
        )


def reset() -> None:
    """Clear all counters. For tests."""
    _buckets.clear()
