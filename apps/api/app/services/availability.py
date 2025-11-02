"""Naive availability calculations for services."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable, List

from sqlalchemy.orm import Session

from app.models import Appointment, Service


def _as_utc(value: datetime) -> datetime:
    """Ensure datetime values are timezone-aware in UTC."""

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def overlaps(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    """Return True when two time ranges overlap."""

    return start_a < end_b and start_b < end_a


def _business_window(day: date) -> tuple[datetime, datetime]:
    """Return the UTC open and close window for the provided date."""

    open_time = datetime.combine(day, time(hour=9, minute=0), tzinfo=timezone.utc)
    close_time = datetime.combine(day, time(hour=18, minute=0), tzinfo=timezone.utc)
    return open_time, close_time


def _generate_slots(duration_minutes: int, open_time: datetime, close_time: datetime) -> List[datetime]:
    """Generate potential start times for the provided window."""

    minutes = duration_minutes if duration_minutes > 0 else 30
    slots: List[datetime] = []
    cursor = open_time
    delta = timedelta(minutes=minutes)
    while cursor + delta <= close_time:
        slots.append(cursor)
        cursor += delta
    if duration_minutes <= 0 and open_time not in slots:
        slots.append(open_time)
    return slots


def get_daily_availability(db: Session, service: Service, target_date: date) -> list[datetime]:
    """Return a list of available start times for the given service and date."""

    open_time, close_time = _business_window(target_date)
    potential_slots = _generate_slots(service.duration_minutes, open_time, close_time)

    if not potential_slots:
        return []

    # Fetch appointments that overlap the day window.
    appointments: Iterable[Appointment] = (
        db.query(Appointment)
        .filter(Appointment.start_time < close_time, Appointment.end_time > open_time)
        .all()
    )

    blocked_slots: set[datetime] = set()
    for slot in potential_slots:
        end_time = slot + (timedelta(minutes=service.duration_minutes) if service.duration_minutes > 0 else timedelta())
        for appt in appointments:
            appt_start = _as_utc(appt.start_time)
            appt_end = _as_utc(appt.end_time)
            if overlaps(slot, end_time, appt_start, appt_end):
                blocked_slots.add(slot)
                break

    available = [slot for slot in potential_slots if slot not in blocked_slots]
    available.sort()
    return available
