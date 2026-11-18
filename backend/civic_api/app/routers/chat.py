from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import safe_decode_token
from app.database import get_db
from app.models import User
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])
optional_bearer = HTTPBearer(auto_error=False)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatLink(BaseModel):
    label: str
    path: str


class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = []
    links: list[ChatLink] = []


def _optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    payload = safe_decode_token(credentials.credentials)
    if not payload:
        return None
    email = payload.get("sub")
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()


@router.post("", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    user: User | None = Depends(_optional_user),
):
    result = chat_service.generate_reply(
        body.message,
        user_name=user.name if user else None,
    )
    links = result.links
    if not user:
        guest_ok = {"/", "/login", "/signup", "/department-login"}
        links = [lnk for lnk in links if lnk["path"] in guest_ok] or [
            {"label": "Citizen login", "path": "/login"},
            {"label": "Sign up", "path": "/signup"},
        ]
    elif user.role == "DEPARTMENT_ADMIN":
        # Prefer department routes for officers
        dept_links = [
            {"label": "Department dashboard", "path": "/department/dashboard"},
            {"label": "Review queue", "path": "/department/review"},
        ]
        links = dept_links + [lnk for lnk in links if lnk["path"].startswith("/department")]
        if not links:
            links = dept_links
    return ChatResponse(
        reply=result.reply,
        suggestions=result.suggestions,
        links=[ChatLink(**lnk) for lnk in links],
    )
