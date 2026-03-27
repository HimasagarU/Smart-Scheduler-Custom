from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.api.auth import get_current_user
from app.services.slot_service import find_free_slots

router = APIRouter()

class SlotRequest(BaseModel):
    n_days: int
    month: int
    year: int
    blackout_days: List[str]
    prefer_days: List[str] = []
    holiday_pref: str = "avoid"

@router.post("/find")
async def find_slots(req: SlotRequest, current_user: dict = Depends(get_current_user)):
    blackout = req.blackout_days if req.blackout_days else current_user.get("preferences", {}).get("blackout_days", [])
    result = await find_free_slots(
        str(current_user["_id"]), 
        req.n_days, 
        req.month, 
        req.year, 
        blackout,
        req.prefer_days,
        req.holiday_pref
    )
    return result
