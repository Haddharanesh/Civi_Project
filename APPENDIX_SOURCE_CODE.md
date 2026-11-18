# APPENDIX A — Source Code Listings

This appendix presents selected source code from the **CivicConnect** civic complaint management system. Both **Frontend (React)** and **Backend (FastAPI)** excerpts are included. Non-essential UI and helper logic is omitted for brevity.

---

## A.1 Frontend — Citizen Login

**File:** `frontend/src/pages/Login.jsx`

```jsx
import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShieldCheck, MapPin, Users } from "lucide-react"
import API from "../services/api"
import { AuthContext } from "../contexts/AuthContext"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await API.post("/auth/login", { email, password })
      const user = res.data.user
      const token = res.data.token

      if (user.role === "SUPER_ADMIN") {
        login(user, token)
        navigate("/superadmin/dashboard")
        return
      }
      if (user.role === "DEPARTMENT_ADMIN") {
        login(user, token)
        navigate("/department/dashboard")
        return
      }
      login(user, token)
      navigate("/dashboard")
    } catch (err) {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  // UI form markup omitted for brevity
}
```

---

## A.2 Frontend — Citizen Signup

**File:** `frontend/src/pages/Signup.jsx`

```jsx
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Megaphone, MapPin, CheckCircle2 } from "lucide-react"
import API from "../services/api"

function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    try {
      await API.post("/auth/register", { name, email, password })
      setMessage("Account created successfully. Redirecting to login…")
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // UI form markup omitted for brevity
}
```

---

## A.3 Frontend — Report Issue

**File:** `frontend/src/pages/ReportIssue.jsx`

```jsx
import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import { Link, useNavigate } from "react-router-dom"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import API from "../services/api"
import { IMAGE_BASE_URL } from "../config"
import { StatusPill, PriorityPill, PrimaryButton, SecondaryButton } from "../components/UI/CivicUI"

function LocationPicker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

const categories = [
  { value: "ROAD", label: "Road / Pothole" },
  { value: "WASTE", label: "Garbage / Sanitation" },
  { value: "ELECTRICITY", label: "Streetlight / Power" },
  { value: "WATER", label: "Water Leakage" },
  { value: "OTHER", label: "Other" },
]

function SimilarComplaintCard({
  complaint, message, alreadySupported, supporting,
  onViewDetails, onSupport, onDismiss,
}) {
  if (!complaint) return null
  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 mb-6">
      <h2 className="font-display text-xl font-semibold text-forest mb-2">
        Review before supporting
      </h2>
      <p className="text-sm text-stone-muted mb-5">{message}</p>
      {/* Similar complaint preview + View / Support / Keep editing actions */}
    </div>
  )
}

const ReportIssue = () => {
  const navigate = useNavigate()
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("ROAD")
  const [image, setImage] = useState(null)
  const [location, setLocation] = useState(null)
  const [similar, setSimilar] = useState(null)
  const [loading, setLoading] = useState(false)

  // Map geolocation, form submit, and duplicate-handling UI omitted for brevity
}
```

---

## A.4 Frontend — My Complaints

**File:** `frontend/src/pages/MyComplaints.jsx`

```jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import {
  PageHeader, StatusPill, PriorityPill, SummaryCard,
  EmptyState, PrimaryButton,
} from "../components/UI/CivicUI"

function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 })
  const navigate = useNavigate()

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      new: data.filter((c) => c.status === "NEW").length,
      inProgress: data.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: data.filter((c) => c.status === "RESOLVED").length,
    })
  }

  const fetchComplaints = (silent = false) => {
    if (!silent) setLoading(true)
    API.get("/complaints/my")
      .then((res) => {
        setComplaints(res.data)
        calculateStats(res.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchComplaints() }, [])
  useRealtimeRefresh(() => fetchComplaints(true), ["complaint", "notification"])

  // List rendering and summary cards omitted for brevity
}
```

---

## A.5 Backend — Application Entry Point

**File:** `backend/civic_api/app/main.py`

```python
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
    return {"status": "ok", "message": "Civic Python API running"}
```

---

## A.6 Backend — Authentication Router

**File:** `backend/civic_api/app/routers/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth import create_access_token
from app.database import get_db
from app.schemas import UserLogin, UserOut, UserRegister
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db, payload.name, payload.email, payload.password)
        return UserOut.model_validate(user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc

@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    try:
        user = auth_service.login_user(db, payload.email, payload.password)
        token = create_access_token(user.email, user.role)
        return {
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": "Invalid credentials"}) from exc
```

---

## A.7 Backend — Complaints Router

**File:** `backend/civic_api/app/routers/complaints.py`

```python
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user, require_roles
from app.models import Complaint, User
from app.schemas import ComplaintOut, CreateComplaintResponse
from app.services import complaint_service, duplicate_service, vote_service

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

@router.post("", response_model=CreateComplaintResponse)
async def create_complaint(
    description: str = Form(...),
    category: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile | None = File(None),
    user: User = Depends(require_roles("USER")),
    db: Session = Depends(get_db),
):
    duplicate = duplicate_service.find_duplicate_complaint(
        db, description=description, category=category,
        latitude=latitude, longitude=longitude,
    )
    if duplicate:
        already_supported = vote_service.has_voted(db, user.id, duplicate.id)
        return CreateComplaintResponse(
            isDuplicate=True,
            voteAdded=False,
            alreadySupported=already_supported,
            message="A similar complaint already exists nearby.",
            complaint=ComplaintOut.model_validate(duplicate),
        )

    complaint = Complaint(
        description=description, category=category,
        latitude=latitude, longitude=longitude,
    )
    if image and image.filename:
        complaint.image_url = await complaint_service.save_upload(image)

    created = complaint_service.create_complaint(db, complaint, user.email)
    return CreateComplaintResponse(
        isDuplicate=False,
        message="Issue reported successfully",
        complaint=ComplaintOut.model_validate(created),
    )

@router.get("/my", response_model=list[ComplaintOut])
def get_my_complaints(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return complaint_service.get_complaints_by_user_email(db, user.email)

@router.get("/public", response_model=list[ComplaintOut])
def get_public_complaints(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return complaint_service.get_all_complaints(db)
```

---

## A.8 Backend — Duplicate Detection Service

**File:** `backend/civic_api/app/services/duplicate_service.py`

```python
"""Duplicate complaint detection add-on.
Uses location radius + category similarity + description text similarity.
"""
from __future__ import annotations
import math
import re
from difflib import SequenceMatcher
from sqlalchemy.orm import Session
from app.models import Complaint

CATEGORY_GROUPS = {
    "road": {"road", "pothole", "street", "bridge", "footpath"},
    "waste": {"waste", "garbage", "sanitation", "trash", "dump"},
    "electricity": {"electricity", "streetlight", "power", "light", "wire"},
    "water": {"water", "drainage", "sewage", "leakage", "pipe", "flood"},
    "other": {"other", "general", "municipal"},
}

def _normalize_category(category: str | None) -> str:
    if not category:
        return "other"
    text = category.lower().strip().replace("_", " ")
    for group, keywords in CATEGORY_GROUPS.items():
        if group in text or any(k in text for k in keywords):
            return group
    return "other"

def _groups_from_text(description: str | None) -> set[str]:
    if not description:
        return set()
    desc = description.lower()
    found = set()
    for group, keywords in CATEGORY_GROUPS.items():
        if group == "other":
            continue
        if group in desc or any(k in desc for k in keywords):
            found.add(group)
    return found

# Haversine distance, Jaccard / SequenceMatcher scoring,
# and find_duplicate_complaint() omitted for brevity
```

---

## A.9 Backend — Department Review APIs

**File:** `backend/civic_api/app/routers/department.py`

```python
@router.put("/complaints/{complaint_id}/status")
def update_complaint_status(complaint_id: int, status: str, user=Depends(...), db=Depends(...)):
    return complaint_service.update_status(db, complaint_id, status)

@router.put("/complaints/{complaint_id}/remarks")
def add_remarks(complaint_id: int, remarks: str, user=Depends(...), db=Depends(...)):
    return complaint_service.add_remarks(db, complaint_id, remarks)

@router.get("/dashboard/stats")
def get_dashboard_stats(user=Depends(...), db=Depends(...)):
    return complaint_service.get_department_stats(db, user.department)
```

---

## A.10 Backend — Database Models

**File:** `backend/civic_api/app/models.py`

```python
class User(Base):
    __tablename__ = "users"
    id, name, email, password, role, department_id

class Complaint(Base):
    __tablename__ = "complaints"
    id, title, category, description, latitude, longitude
    status, priority, image_url, upvotes, remarks
    user_id, department_id, created_at, updated_at

class Notification(Base):
    __tablename__ = "notifications"
    id, user_id, department_id, message, type, complaint_id, is_read

class Vote(Base):
    __tablename__ = "votes"
    id, user_id, complaint_id  # unique(user_id, complaint_id)
```

---

## Index of Listings

| Section | Description | Layer |
|---------|-------------|--------|
| A.1 | Citizen Login | Frontend |
| A.2 | Citizen Signup | Frontend |
| A.3 | Report Issue | Frontend |
| A.4 | My Complaints | Frontend |
| A.5 | Application Entry (`main.py`) | Backend |
| A.6 | Authentication Router | Backend |
| A.7 | Complaints Router | Backend |
| A.8 | Duplicate Detection Service | Backend |
| A.9 | Department Review APIs | Backend |
| A.10 | Database Models | Backend |

---

*End of Appendix A*
