from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Query

router = APIRouter(prefix="/slots", tags=["slots"])


@router.get("")
def get_slots(company_id: str | None = None, date: date = Query(...), type: str = Query(...)):
    start = datetime.combine(date, time(hour=9))
    slots = []
    for i in range(0, 18):
        dt = start + timedelta(minutes=30 * i)
        if dt.time() > time(hour=17, minute=30):
            break
        slots.append(dt.isoformat())
    return {"slots": slots}
