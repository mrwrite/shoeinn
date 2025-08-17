from datetime import datetime, timezone

def parse_client_iso(value: str) -> datetime:
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        raise ValueError("datetime must be timezone-aware")
    return dt

def to_utc(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc)

def tz_offset_minutes(dt: datetime) -> int:
    return int(dt.utcoffset().total_seconds() // 60)

def local_iso_from_utc(dt: datetime) -> str:
    local_tz = datetime.now().astimezone().tzinfo
    return dt.astimezone(local_tz).isoformat()
