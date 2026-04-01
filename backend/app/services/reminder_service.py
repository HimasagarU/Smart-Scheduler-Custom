import smtplib
from email.message import EmailMessage
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from app.core.config import settings

scheduler = BackgroundScheduler()

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("Scheduler started")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler shutdown")

def send_email(to_email: str, title: str, start_date: str, description: str = ""):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Skipping email to {to_email} for event {title}")
        return
        
    msg = EmailMessage()
    msg['Subject'] = f"Reminder: Upcoming Event '{title}'"
    msg['From'] = settings.SMTP_EMAIL
    msg['To'] = to_email
    
    desc_text = f"\n    Description: {description}" if description else ""
    
    msg.set_content(f"""
    Hello!
    
    This is a friendly reminder for your upcoming event:
    Title: {title}
    Start Date: {start_date}{desc_text}
    
    Best,
    Smart Scheduler Team
    """)
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        print(f"Sent reminder email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_cancellation_email(to_email: str, event_title: str, canceled_by_name: str):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Skipping cancellation email to {to_email}")
        return
        
    msg = EmailMessage()
    msg['Subject'] = f"Notice: Participant Canceled '{event_title}'"
    msg['From'] = settings.SMTP_EMAIL
    msg['To'] = to_email
    
    msg.set_content(f"""
    Hello,
    
    Just a heads up that your shared scheduler event has been updated.
    
    {canceled_by_name} has removed '{event_title}' from their calendar.
    
    The event remains on your calendar, but please be aware they are no longer attending.
    
    Best,
    Smart Scheduler Team
    """)
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        print(f"Sent cancellation email to {to_email}")
    except Exception as e:
        print(f"Failed to send cancellation email to {to_email}: {e}")

def send_organizer_cancellation_email(to_email: str, event_title: str, canceled_by_name: str):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Skipping organizer cancellation email to {to_email}")
        return
        
    msg = EmailMessage()
    msg['Subject'] = f"Notice: Event Canceled '{event_title}'"
    msg['From'] = settings.SMTP_EMAIL
    msg['To'] = to_email
    
    msg.set_content(f"""
    Hello,
    
    This is an automatic notification regarding your schedule.
    
    The Organizer ({canceled_by_name}) has canceled the shared event: '{event_title}'.
    
    This event has been automatically removed from your calendar, and any related reminders have been unscheduled.
    
    Best,
    Smart Scheduler Team
    """)
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        print(f"Sent organizer cancellation email to {to_email}")
    except Exception as e:
        print(f"Failed to send organizer cancellation email to {to_email}: {e}")

def send_event_created_email(to_email: str, event_title: str, organizer_name: str, start_date: str, description: str = ""):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Skipping event creation email to {to_email}")
        return
        
    msg = EmailMessage()
    msg['Subject'] = f"New Event Scheduled: '{event_title}'"
    msg['From'] = settings.SMTP_EMAIL
    msg['To'] = to_email
    
    desc_text = f"\n    Description: {description}" if description else ""
    
    msg.set_content(f"""
    Hello,
    
    A new shared event has been scheduled with you.
    
    Organizer: {organizer_name}
    Event Title: '{event_title}'
    Date: {start_date}{desc_text}
    
    This has been automatically added to your Smart Scheduler calendar.
    
    Best,
    Smart Scheduler Team
    """)
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        print(f"Sent event creation email to {to_email}")
    except Exception as e:
        print(f"Failed to send event creation email to {to_email}: {e}")

def send_event_updated_email(to_email: str, event_title: str, organizer_name: str, new_start_date: str, new_end_date: str, description: str = ""):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Skipping event update email to {to_email}")
        return
        
    msg = EmailMessage()
    msg['Subject'] = f"Event Updated: '{event_title}'"
    msg['From'] = settings.SMTP_EMAIL
    msg['To'] = to_email
    
    desc_text = f"\n    Description: {description}" if description else ""
    
    msg.set_content(f"""
    Hello,
    
    A shared event you are participating in has been updated.
    
    Organizer: {organizer_name}
    Event Title: '{event_title}'
    New Dates: {new_start_date} to {new_end_date}{desc_text}
    
    Your Smart Scheduler calendar has been automatically updated with the new details.
    
    Best,
    Smart Scheduler Team
    """)
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        print(f"Sent event update email to {to_email}")
    except Exception as e:
        print(f"Failed to send event update email to {to_email}: {e}")

def schedule_reminder(user_email: str, event_title: str, start_date: str, job_id: str, lead_days: int = 1, description: str = ""):
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    trigger_time = start_dt - timedelta(days=lead_days)
    
    if trigger_time < datetime.now():
        trigger_time = datetime.now() + timedelta(seconds=10)
        
    scheduler.add_job(
        send_email,
        trigger='date',
        run_date=trigger_time,
        id=job_id,
        kwargs={"to_email": user_email, "title": event_title, "start_date": start_date, "description": description}
    )
    print(f"Scheduled reminder for '{event_title}' at {trigger_time} with job id '{job_id}'")

def unschedule_reminder(job_id: str):
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        print(f"Removed scheduled reminder job '{job_id}'")
