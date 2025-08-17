from fastapi import APIRouter, Query
from datetime import datetime, date, time, timedelta

router = APIRouter()

@router.get("/slots")
def get_slots(date: str, type: str = Query(..., regex="^(pickup|dropoff)$")):
    d = datetime.fromisoformat(date).date()
    tz = datetime.now().astimezone().tzinfo
    start = datetime.combine(d, time(9, 0), tzinfo=tz)
    end = datetime.combine(d, time(17, 30), tzinfo=tz)
    delta = timedelta(minutes=30)
    slots = []
    cur = start
    while cur <= end:
        slots.append({"start_time_iso": cur.isoformat()})
        cur += delta
    return slots
