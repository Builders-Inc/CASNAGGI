"""Generate the bcrypt hash for ADMIN_PASSWORD_HASH.

    python -m app.scripts.hash_password

The plaintext is read from a prompt rather than an argument so it does not end
up in the shell history. Only the hash goes in backend/.env; the password itself
is never stored anywhere on the server.

Note for deployment: a bcrypt hash contains '$', and Docker Compose interpolates
env_file values. Unquoted or double-quoted, the segment after the second '$' is
read as an empty variable reference and the hash arrives truncated, so every
login fails with "Invalid salt". The output below is single-quoted, which
Compose takes literally. Confirm what actually landed with:

    docker compose exec api printenv ADMIN_PASSWORD_HASH
"""

import getpass
import secrets
import sys

from ..security import hash_password

MIN_LENGTH = 12


def main() -> int:
    password = getpass.getpass("New admin password: ")
    if len(password) < MIN_LENGTH:
        print(f"Too short - use at least {MIN_LENGTH} characters.", file=sys.stderr)
        return 1
    if password != getpass.getpass("Confirm: "):
        print("Passwords do not match.", file=sys.stderr)
        return 1

    # Single-quoted on purpose: see the module docstring.
    print("\nAdd these to backend/.env exactly as shown, quotes included:\n")
    print(f"ADMIN_PASSWORD_HASH='{hash_password(password)}'")
    print(f"JWT_SECRET='{secrets.token_urlsafe(48)}'")
    print("\nRotating JWT_SECRET signs every existing session out immediately.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
