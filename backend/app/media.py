"""Static media (event videos) served from a directory on the API host.

Videos are too large for the git repo and the Netlify bundle, so they live in
a host directory mounted into the container and are served from /media on the
API's own hostname. Files are copied there out of band (scp/rsync), never
uploaded through the API.

Starlette's FileResponse answers HTTP Range requests, which is what lets a
<video> element seek without downloading the whole file first.
"""

from starlette.responses import Response
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

# A week. Files are renamed rather than overwritten when they change, but they
# are not content-hashed, so this stays short of "immutable".
CACHE_CONTROL = "public, max-age=604800"


class MediaFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope) -> Response:
        response = await super().get_response(path, scope)
        if response.status_code in (200, 206, 304):
            response.headers["Cache-Control"] = CACHE_CONTROL
        return response
