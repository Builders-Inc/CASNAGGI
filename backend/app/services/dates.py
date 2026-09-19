"""Human-readable date labels."""

from datetime import date


def derive_label(value: date) -> str:
    """Month-and-year, matching the dominant style of the existing entries.

    Only used to fill `dateLabel` when an admin leaves it blank; anything they
    type is kept verbatim, which is why the field is stored rather than derived
    on read.
    """
    return f"{value.strftime('%B')} {value.year}"
