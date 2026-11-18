import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import safe_decode_token
from app.database import get_db
from app.models import User
from app.realtime import hub

router = APIRouter(tags=["realtime"])


def _user_from_token(token: str, db: Session) -> User:
    payload = safe_decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.get("/api/realtime/stream")
async def realtime_stream(
    token: str = Query(..., description="JWT access token"),
    db: Session = Depends(get_db),
):
    """Server-Sent Events stream. EventSource cannot send Authorization headers, so token is a query param."""
    user = _user_from_token(token, db)
    user_id = user.id
    department_id = user.department_id
    role = user.role

    async def event_generator():
        sub = hub.subscribe(
            user_id=user_id,
            department_id=department_id,
            role=role,
            include_public=True,
        )
        try:
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(sub.queue.get(), timeout=20.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"
        finally:
            hub.unsubscribe(sub)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
