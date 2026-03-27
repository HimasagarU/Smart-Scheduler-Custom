from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from bson import ObjectId
from app.api.auth import get_current_user
from app.db.models import EventCreate, Event
from app.db.mongodb import get_database
from app.services.reminder_service import schedule_reminder, unschedule_reminder
import holidays

router = APIRouter()

@router.get("/holidays")
async def get_holidays(year: int, current_user: dict = Depends(get_current_user)):
    in_holidays = holidays.India(years=[year-1, year, year+1])
    holiday_events = []
    
    for d, name in sorted(in_holidays.items()):
        holiday_events.append({
            "_id": f"hol-{d.isoformat()}",
            "title": name,
            "description": "Public Holiday",
            "start_date": d.isoformat(),
            "end_date": d.isoformat(),
            "is_holiday": True
        })
    return holiday_events

@router.post("/confirm", status_code=status.HTTP_201_CREATED)
async def confirm_event(event_req: EventCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    new_event = Event(
        user_id=str(current_user["_id"]),
        title=event_req.title,
        description=event_req.description,
        start_date=event_req.start_date,
        end_date=event_req.end_date
    )
    event_dict = new_event.dict()
    result = await db["events"].insert_one(event_dict)
    
    event_id_str = str(result.inserted_id)
    event_dict["_id"] = event_id_str
    
    lead_days = current_user.get("preferences", {}).get("reminder_lead_days", 1)
    schedule_reminder(
        user_email=current_user["email"],
        event_title=event_req.title,
        start_date=event_req.start_date,
        job_id=event_id_str,
        lead_days=lead_days
    )
    
    return {"message": "Event created and reminder scheduled", "event": event_dict}

@router.get("/list")
async def list_events(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db["events"].find({"user_id": str(current_user["_id"])}).sort("start_date", 1)
    events = await cursor.to_list(length=None)
    for ev in events:
        ev["_id"] = str(ev["_id"])
    return events

@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        obj_id = ObjectId(event_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
        
    result = await db["events"].delete_one({"_id": obj_id, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized")
        
    unschedule_reminder(event_id)
    return {"message": "Event deleted successfully"}
