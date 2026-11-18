import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.realtime import hub
from app.routers import auth, chat, complaints, department, notifications, realtime, superadmin
from app.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    hub.set_loop(asyncio.get_running_loop())
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Civic API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")

app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(department.router)
app.include_router(notifications.router)
app.include_router(notifications.notifications_router)
app.include_router(realtime.router)
app.include_router(chat.router)
app.include_router(superadmin.router)


@app.get("/")
def health():
    return {
        "status": "ok",
        "message": "Civic Python API running",
        "had_creations": "Had Creations",
        "creator": "Had Creations",
    }
