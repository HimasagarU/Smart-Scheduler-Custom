from datetime import date, timedelta
import calendar
import holidays
from app.db.mongodb import get_database

async def find_free_slots(user_id: str, n_days: int, month: int, year: int, 
                          avoid_days: list[str], prefer_days: list[str] = None, 
                          holiday_pref: str = "avoid") -> dict:
    db = get_database()
    prefer_days = prefer_days or []
    
    weekday_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }
    avoid_ints = [weekday_map.get(day) for day in avoid_days if day in weekday_map]
    prefer_ints = [weekday_map.get(day) for day in prefer_days if day in weekday_map]
    
    in_holidays = holidays.India(years=[year, year+1])

    for offset in range(4): # Check current month and next 3 months if current month not available
        m = month + offset
        y = year + (m - 1) // 12
        m = (m - 1) % 12 + 1
        
        check_month = m
        check_year = y
        
        _, last_day = calendar.monthrange(check_year, check_month)
        
        today = date.today()
        start_day = today.day + 1 if today.year == check_year and today.month == check_month else 1
        start_day = max(1, start_day)
        
        if today.year > check_year or (today.year == check_year and today.month > check_month):
            continue
            
        all_days = [date(check_year, check_month, d) for d in range(start_day, last_day + 1)]
        
        start_of_month_str = f"{check_year}-{check_month:02d}-01"
        end_of_month_str = f"{check_year}-{check_month:02d}-{last_day:02d}"
        
        events_cursor = db["events"].find({
            "user_id": user_id,
            "$or": [
                {"start_date": {"$lte": end_of_month_str}, "end_date": {"$gte": start_of_month_str}}
            ]
        })
        events = await events_cursor.to_list(length=None)
        
        busy_days = set()
        for limit_event in events:
            e_start = date.fromisoformat(limit_event["start_date"])
            e_end = date.fromisoformat(limit_event["end_date"])
            current = e_start
            while current <= e_end:
                busy_days.add(current)
                current += timedelta(days=1)
                
        valid_slots = []
        for i in range(len(all_days) - n_days + 1):
            window = all_days[i:i+n_days]
            
            is_valid = True
            for d in window:
                if d in busy_days:
                    is_valid = False
                    break
                if d.weekday() in avoid_ints:
                    is_valid = False
                    break
                if holiday_pref == "avoid" and d in in_holidays:
                    is_valid = False
                    break
                    
            if not is_valid:
                continue
                
            # preference score
            score = 0
            for d in window:
                if holiday_pref == "prefer" and d in in_holidays:
                    score += 1
                if d.weekday() in prefer_ints:
                    score += 1
                    
            valid_slots.append({
                "start_date": window[0].isoformat(),
                "end_date": window[-1].isoformat(),
                "score": score
            })
                
        if valid_slots:
            valid_slots.sort(key=lambda x: x["score"], reverse=True)
            
            message = "Found slots" if offset == 0 else f"No slots in original month. Next available: {calendar.month_name[check_month]}"
            return {
                "slots": [{"start_date": s["start_date"], "end_date": s["end_date"]} for s in valid_slots[:3]],
                "message": message,
                "month": check_month,
                "year": check_year
            }
            
    return {"slots": [], "message": "No slots found in the next 3 months", "month": month, "year": year}


async def find_deadline_slots(user_id: str, n_days: int, deadline: str,
                               avoid_days: list[str], prefer_days: list[str] = None, holiday_pref: str = "avoid") -> dict:
    """Find the latest possible n-day window that ends on or before the deadline."""
    db = get_database()
    deadline_date = date.fromisoformat(deadline)
    today = date.today()
    
    if deadline_date <= today:
        return {"slots": [], "message": "Deadline must be in the future"}
    
    weekday_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }
    avoid_ints = [weekday_map.get(day) for day in avoid_days if day in weekday_map]
    prefer_days = prefer_days or []
    prefer_ints = [weekday_map.get(day) for day in prefer_days if day in weekday_map]
    in_holidays = holidays.India(years=[deadline_date.year, today.year])

    all_days = []
    current = today + timedelta(days=1)
    while current < deadline_date:
        all_days.append(current)
        current += timedelta(days=1)
    
    if len(all_days) < n_days:
        return {"slots": [], "message": "Not enough days between now and deadline"}
    
    start_str = all_days[0].isoformat()
    end_str = deadline_date.isoformat()
    events_cursor = db["events"].find({
        "user_id": user_id,
        "$or": [{"start_date": {"$lte": end_str}, "end_date": {"$gte": start_str}}]
    })
    events = await events_cursor.to_list(length=None)
    
    busy_days = set()
    for ev in events:
        e_start = date.fromisoformat(ev["start_date"])
        e_end = date.fromisoformat(ev["end_date"])
        d = e_start
        while d <= e_end:
            busy_days.add(d)
            d += timedelta(days=1)
    
    # Search backward from deadline
    valid_slots = []
    for i in range(len(all_days) - n_days, -1, -1):
        window = all_days[i:i + n_days]
        is_valid = True
        for d in window:
            if d in busy_days or d.weekday() in avoid_ints:
                is_valid = False
                break
            if holiday_pref == "avoid" and d in in_holidays:
                is_valid = False
                break
        if is_valid:
            score = 0
            for d in window:
                if holiday_pref == "prefer" and d in in_holidays:
                    score += 1
                if d.weekday() in prefer_ints:
                    score += 1
            
            valid_slots.append({
                "start_date": window[0].isoformat(),
                "end_date": window[-1].isoformat(),
                "score": score
            })
            
    if valid_slots:
        valid_slots.sort(key=lambda x: x["score"], reverse=True)
        valid_slots = valid_slots[:3]
        
    msg = "Found slots (best matched first, before deadline)" if valid_slots else "No free window before deadline"
    return {"slots": [{"start_date": s["start_date"], "end_date": s["end_date"]} for s in valid_slots], "message": msg}


async def find_overlap_slots(user_id: str, other_user_id: str, n_days: int,
                              month: int, year: int, avoid_days: list[str],
                              prefer_days: list[str] = None, holiday_pref: str = "avoid") -> dict:
    """Find n consecutive days where both users are free."""
    db = get_database()
    
    weekday_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }
    avoid_ints = [weekday_map.get(day) for day in avoid_days if day in weekday_map]
    prefer_days = prefer_days or []
    prefer_ints = [weekday_map.get(day) for day in prefer_days if day in weekday_map]
    in_holidays = holidays.India(years=[year, year + 1])
    
    _, last_day = calendar.monthrange(year, month)
    today = date.today()
    start_day = today.day + 1 if today.year == year and today.month == month else 1
    start_day = max(1, start_day)
    
    if today.year > year or (today.year == year and today.month > month):
        return {"slots": [], "message": "Month is in the past", "month": month, "year": year}
    
    all_days = [date(year, month, d) for d in range(start_day, last_day + 1)]
    
    if len(all_days) < n_days:
        return {"slots": [], "message": "Not enough days left in this month", "month": month, "year": year}
    
    start_str = f"{year}-{month:02d}-{start_day:02d}"
    end_str = f"{year}-{month:02d}-{last_day:02d}"
    
    events_cursor = db["events"].find({
        "user_id": {"$in": [user_id, other_user_id]},
        "$or": [{"start_date": {"$lte": end_str}, "end_date": {"$gte": start_str}}]
    })
    events = await events_cursor.to_list(length=None)
    
    busy_days = set()
    for ev in events:
        e_start = date.fromisoformat(ev["start_date"])
        e_end = date.fromisoformat(ev["end_date"])
        d = e_start
        while d <= e_end:
            busy_days.add(d)
            d += timedelta(days=1)
    
    valid_slots = []
    for i in range(len(all_days) - n_days + 1):
        window = all_days[i:i + n_days]
        is_valid = True
        for d in window:
            if d in busy_days or d.weekday() in avoid_ints:
                is_valid = False
                break
            if holiday_pref == "avoid" and d in in_holidays:
                is_valid = False
                break
        if is_valid:
            score = 0
            for d in window:
                if holiday_pref == "prefer" and d in in_holidays:
                    score += 1
                if d.weekday() in prefer_ints:
                    score += 1
            
            valid_slots.append({
                "start_date": window[0].isoformat(),
                "end_date": window[-1].isoformat(),
                "score": score
            })
    
    if valid_slots:
        valid_slots.sort(key=lambda x: x["score"], reverse=True)
        valid_slots = valid_slots[:3]
        
    msg = f"Found {len(valid_slots)} overlapping free slot(s)" if valid_slots else "No overlapping free slots found"
    return {"slots": [{"start_date": s["start_date"], "end_date": s["end_date"]} for s in valid_slots], "message": msg, "month": month, "year": year}
