from datetime import datetime, timedelta, timezone


def parse_client_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


def to_utc(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc)


def tz_offset_minutes(dt: datetime) -> int:
    offset = dt.utcoffset() or timedelta(0)
    return int(offset.total_seconds() // 60)


def local_iso_from_utc(utc_dt: datetime, offset_min: int) -> str:
    tz = timezone(timedelta(minutes=offset_min))
    return utc_dt.astimezone(tz).isoformat()
