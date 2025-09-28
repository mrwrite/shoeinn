from datetime import date, datetime, time, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.available_slot import AvailableSlot
from app.utils.time import to_utc

router = APIRouter(prefix="/slots", tags=["slots"])


@router.get("")
def get_slots(
    company_id: UUID | None = None,
    date: date = Query(...),
    slot_type: str = Query(...),
    db: Session = Depends(get_db),
):
    start = datetime.combine(date, time(hour=9))
    slots = []
    for i in range(0, 18):
        dt = start + timedelta(minutes=30 * i)
        if dt.time() > time(hour=17, minute=30):
            break
        slots.append(dt.isoformat())

    if not company_id:
        return {"slots": slots}

    day_start = datetime.combine(date, time.min)
    day_end = datetime.combine(date, time.max)
    local_tz = datetime.now().astimezone().tzinfo
    day_start_utc = to_utc(day_start.replace(tzinfo=local_tz))
    day_end_utc = to_utc(day_end.replace(tzinfo=local_tz))

    booked_times = {
        slot.start_time_utc.isoformat()
        for slot in db.query(AvailableSlot)
        .filter(
            AvailableSlot.company_id == company_id,
            AvailableSlot.start_time_utc >= day_start_utc,
            AvailableSlot.start_time_utc <= day_end_utc,
            AvailableSlot.is_available.is_(False),
        )
        .all()
    }

    filtered = []
    for slot_iso in slots:
        slot_dt_local = datetime.fromisoformat(slot_iso).replace(tzinfo=local_tz)
        if to_utc(slot_dt_local).isoformat() in booked_times:
            continue
        filtered.append(slot_iso)
    return {"slots": filtered}
