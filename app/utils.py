import json


def safe_json_loads(raw: str | None):
    """Parse a JSON string, returning None on failure."""
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None
