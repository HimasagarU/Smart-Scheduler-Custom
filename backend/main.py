from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, slots, events
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.services.reminder_service import start_scheduler, shutdown_scheduler
import contextlib

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()
    await close_mongo_connection()


app = FastAPI(title="Smart Scheduler", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(slots.router, prefix="/slots", tags=["slots"])
app.include_router(events.router, prefix="/events", tags=["events"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Scheduler API"}
