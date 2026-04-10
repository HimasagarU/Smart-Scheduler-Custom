from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks, Query
from typing import List
from bson import ObjectId
from app.api.auth import get_current_user
from app.db.models import EventCreate, Event
import uuid
from app.db.mongodb import get_database
from app.services.reminder_service import schedule_reminder, unschedule_reminder, send_cancellation_email, send_organizer_cancellation_email, send_event_created_email, send_event_updated_email
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
async def confirm_event(event_req: EventCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
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
        
        lead_days_a = current_user.get("preferences", {}).get("reminder_lead_days", 1)
        schedule_reminder(user_email=current_user["email"], event_title=event_req.title, start_date=event_req.start_date, job_id=str(res_a.inserted_id), lead_days=lead_days_a, description=event_req.description)
        
        lead_days_b = other_user.get("preferences", {}).get("reminder_lead_days", 1)
        schedule_reminder(user_email=other_user["email"], event_title=event_req.title, start_date=event_req.start_date, job_id=str(res_b.inserted_id), lead_days=lead_days_b, description=event_req.description)
        
        background_tasks.add_task(
            send_event_created_email,
            to_email=other_user["email"],
            event_title=event_req.title,
            organizer_name=current_user.get("name", "A Colleague"),
            start_date=event_req.start_date,
            description=event_req.description
        )
        
        return {"message": "Shared event created and automatically added to both calendars", "event": dict_a}

    else:

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
        schedule_reminder(user_email=current_user["email"], event_title=event_req.title, start_date=event_req.start_date, job_id=event_dict["_id"], lead_days=lead_days, description=event_req.description)
        
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
async def delete_event(event_id: str, background_tasks: BackgroundTasks, scope: str = Query("me", regex="^(me|all)$"), current_user: dict = Depends(get_current_user)):
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
            
        cursor = db["events"].find({"parent_event_id": event["parent_event_id"]})
        linked_events = await cursor.to_list(length=None)
        
        for e in linked_events:
            unschedule_reminder(str(e["_id"]))
            if str(e["user_id"]) != str(current_user["_id"]):
                try:
                    other_user = await db["users"].find_one({"_id": ObjectId(e["user_id"])})
                    if other_user and other_user.get("email"):
                        background_tasks.add_task(
                            send_organizer_cancellation_email,
                            to_email=other_user["email"],
                            event_title=event.get("title", "Unknown Event"),
                            canceled_by_name=current_user.get("name", "The Organizer")
                        )
                except Exception as ex:
                    print("Failed to dispatch organizer cancellation email:", ex)
            
        await db["events"].delete_many({"parent_event_id": event["parent_event_id"]})
        return {"message": "Shared event canceled for everyone"}
        
    else:
        if event.get("parent_event_id") and not event.get("is_organizer"):
            org_event = await db["events"].find_one({"parent_event_id": event["parent_event_id"], "is_organizer": True})
            if org_event:
                try:
                    org_user = await db["users"].find_one({"_id": ObjectId(org_event["user_id"])})
                    if org_user and org_user.get("email"):
                        background_tasks.add_task(
                            send_cancellation_email,
                            to_email=org_user["email"],
                            event_title=event.get("title", "Unknown Event"),
                            canceled_by_name=current_user.get("name", "An Invitee")
                        )
                except Exception as e:
                    print("Failed to dispatch cancellation email:", e)
                    
        await db["events"].delete_one({"_id": obj_id})
        unschedule_reminder(event_id)
        return {"message": "Event deleted successfully"}

@router.put("/{event_id}", status_code=status.HTTP_200_OK)
async def update_event(event_id: str, event_req: EventCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        obj_id = ObjectId(event_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
        
    event = await db["events"].find_one({"_id": obj_id, "user_id": str(current_user["_id"])})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized")
        
    update_data = {
        "title": event_req.title,
        "description": event_req.description,
        "start_date": event_req.start_date,
        "end_date": event_req.end_date
    }
    
    if event.get("parent_event_id"):
        if not event.get("is_organizer"):
            raise HTTPException(status_code=403, detail="Only the organizer can edit a shared event")
            
        cursor = db["events"].find({"parent_event_id": event["parent_event_id"]})
        linked_events = await cursor.to_list(length=None)
        
        for e in linked_events:
            await db["events"].update_one({"_id": e["_id"]}, {"$set": update_data})
            
            unschedule_reminder(str(e["_id"]))
            
            try:
                e_user = await db["users"].find_one({"_id": ObjectId(e["user_id"])})
                if e_user and e_user.get("email"):
                    lead_days = e_user.get("preferences", {}).get("reminder_lead_days", 1)
                    schedule_reminder(
                        user_email=e_user["email"], 
                        event_title=event_req.title, 
                        start_date=event_req.start_date, 
                        job_id=str(e["_id"]), 
                        lead_days=lead_days,
                        description=event_req.description
                    )
                    
                    if str(e["user_id"]) != str(current_user["_id"]):
                        background_tasks.add_task(
                            send_event_updated_email,
                            to_email=e_user["email"],
                            event_title=event_req.title,
                            organizer_name=current_user.get("name", "The Organizer"),
                            new_start_date=event_req.start_date,
                            new_end_date=event_req.end_date,
                            description=event_req.description
                        )
            except Exception as ex:
                print("Failed to process linked event replacement:", ex)
                
        return {"message": "Shared event updated successfully"}
    else:

        await db["events"].update_one({"_id": obj_id}, {"$set": update_data})
        unschedule_reminder(event_id)
        
        lead_days = current_user.get("preferences", {}).get("reminder_lead_days", 1)
        schedule_reminder(
            user_email=current_user["email"], 
            event_title=event_req.title, 
            start_date=event_req.start_date, 
            job_id=event_id, 
            lead_days=lead_days,
            description=event_req.description
        )
        return {"message": "Event updated successfully"}
