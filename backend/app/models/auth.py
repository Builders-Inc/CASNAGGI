"""Admin login request and token response."""

from pydantic import Field

from .common import ApiModel


class LoginRequest(ApiModel):
    """A JSON body rather than OAuth2PasswordRequestForm.

    The form variant would require python-multipart; keeping login as JSON is
    what lets this project avoid that dependency entirely, since image bytes go
    browser-to-Cloudinary and never pass through the API either.
    """

    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=200)


class TokenResponse(ApiModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    username: str
