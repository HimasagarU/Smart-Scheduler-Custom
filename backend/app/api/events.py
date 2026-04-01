from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from bson import ObjectId
from app.api.auth import get_current_user
from app.db.models import EventCreate, Event
import uuid
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
    
    if event_req.other_user_id:
        try:
            other_obj_id = ObjectId(event_req.other_user_id)
            other_user = await db["users"].find_one({"_id": other_obj_id})
        except:
            other_user = None
            
        if not other_user:
            raise HTTPException(status_code=400, detail="Other user not found")
            
        current_org = current_user.get("organization", "DefaultOrg")
        other_org = other_user.get("organization", "DefaultOrg")
        
        if current_org != other_org:
            raise HTTPException(status_code=403, detail="Cannot schedule multi-user events across different organizations.")
            
        parent_id = str(uuid.uuid4())
        
        # Insert for User A (organizer)
        new_event_a = Event(
            user_id=str(current_user["_id"]),
            title=event_req.title,
            description=event_req.description,
            start_date=event_req.start_date,
            end_date=event_req.end_date,
            parent_event_id=parent_id,
            is_organizer=True,
            shared_with=other_user.get("name")
        )
        dict_a = new_event_a.dict()
        res_a = await db["events"].insert_one(dict_a)
        dict_a["_id"] = str(res_a.inserted_id)
        
        # Insert for User B 
        new_event_b = Event(
            user_id=event_req.other_user_id,
            title=event_req.title,
            description=f"{event_req.description}\n\nScheduled by {current_user.get('name', 'Unknown')}",
            start_date=event_req.start_date,
            end_date=event_req.end_date,
            parent_event_id=parent_id,
            is_organizer=False,
            shared_with=current_user.get("name")
        )
        res_b = await db["events"].insert_one(new_event_b.dict())
        
        # Schedule reminders for both
        lead_days_a = current_user.get("preferences", {}).get("reminder_lead_days", 1)
        schedule_reminder(user_email=current_user["email"], event_title=event_req.title, start_date=event_req.start_date, job_id=str(res_a.inserted_id), lead_days=lead_days_a)
        
        lead_days_b = other_user.get("preferences", {}).get("reminder_lead_days", 1)
        schedule_reminder(user_email=other_user["email"], event_title=event_req.title, start_date=event_req.start_date, job_id=str(res_b.inserted_id), lead_days=lead_days_b)
        
        return {"message": "Shared event created and automatically added to both calendars", "event": dict_a}

    else:
        # Standard isolated event
        new_event = Event(
            user_id=str(current_user["_id"]),
            title=event_req.title,
            description=event_req.description,
            start_date=event_req.start_date,
            end_date=event_req.end_date
        )
        event_dict = new_event.dict()
        result = await db["events"].insert_one(event_dict)
        event_dict["_id"] = str(result.inserted_id)
        
        lead_days = current_user.get("preferences", {}).get("reminder_lead_days", 1)
        schedule_reminder(user_email=current_user["email"], event_title=event_req.title, start_date=event_req.start_date, job_id=event_dict["_id"], lead_days=lead_days)
        
        return {"message": "Event created and reminder scheduled", "event": event_dict}

@router.get("/list")
async def list_events(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db["events"].find({"user_id": str(current_user["_id"])}).sort("start_date", 1)
    events = await cursor.to_list(length=None)
    for ev in events:
        ev["_id"] = str(ev["_id"])
    return events

from fastapi import Query

@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event(event_id: str, scope: str = Query("me", regex="^(me|all)$"), current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        obj_id = ObjectId(event_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
        
    event = await db["events"].find_one({"_id": obj_id, "user_id": str(current_user["_id"])})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized")
        
    if scope == "all" and event.get("parent_event_id"):
        if not event.get("is_organizer"):
            raise HTTPException(status_code=403, detail="Only the organizer can delete this event for everyone")
            
        # Delete all linked events
        cursor = db["events"].find({"parent_event_id": event["parent_event_id"]})
        linked_events = await cursor.to_list(length=None)
        
        for e in linked_events:
            unschedule_reminder(str(e["_id"]))
            
        await db["events"].delete_many({"parent_event_id": event["parent_event_id"]})
        return {"message": "Shared event canceled for everyone"}
        
    else:
        # Delete just this one
        await db["events"].delete_one({"_id": obj_id})
        unschedule_reminder(event_id)
        return {"message": "Event deleted successfully"}
