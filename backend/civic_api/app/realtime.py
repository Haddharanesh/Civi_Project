"""In-process pub/sub for Server-Sent Events (single-worker realtime)."""

from __future__ import annotations

import asyncio
import threading
import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Subscriber:
    queue: asyncio.Queue
    user_id: int | None
    department_id: int | None
    role: str
    include_public: bool = True


class RealtimeHub:
    def __init__(self) -> None:
        self._subscribers: list[Subscriber] = []
        self._lock = threading.Lock()
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def subscribe(
        self,
        *,
        user_id: int | None,
        department_id: int | None,
        role: str,
        include_public: bool = True,
    ) -> Subscriber:
        sub = Subscriber(
            queue=asyncio.Queue(maxsize=64),
            user_id=user_id,
            department_id=department_id,
            role=role,
            include_public=include_public,
        )
        with self._lock:
            self._subscribers.append(sub)
        return sub

    def unsubscribe(self, sub: Subscriber) -> None:
        with self._lock:
            if sub in self._subscribers:
                self._subscribers.remove(sub)

    def publish(self, event: dict[str, Any]) -> None:
        payload = {**event, "ts": event.get("ts") or time.time()}
        loop = self._loop
        if loop is not None and loop.is_running():
            loop.call_soon_threadsafe(self._fanout, payload)
        else:
            self._fanout(payload)

    def _fanout(self, event: dict[str, Any]) -> None:
        with self._lock:
            subscribers = list(self._subscribers)
        for sub in subscribers:
            if not self._matches(sub, event):
                continue
            try:
                sub.queue.put_nowait(event)
            except asyncio.QueueFull:
                # Drop oldest then retry once so stale clients don't block others
                try:
                    _ = sub.queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
                try:
                    sub.queue.put_nowait(event)
                except asyncio.QueueFull:
                    pass

    @staticmethod
    def _matches(sub: Subscriber, event: dict[str, Any]) -> bool:
        if event.get("type") in ("connected", "ping"):
            return True
        if sub.role == "SUPER_ADMIN":
            return True

        channels = event.get("channels") or []
        user_id = event.get("userId")
        department_id = event.get("departmentId")

        if user_id is not None and sub.user_id == user_id:
            return True
        if department_id is not None and sub.department_id == department_id:
            return True
        if "public" in channels and sub.include_public:
            return True
        if "all" in channels:
            return True
        return False


hub = RealtimeHub()


def publish_update(
    *,
    type_: str,
    user_id: int | None = None,
    department_id: int | None = None,
    complaint_id: int | None = None,
    channels: list[str] | None = None,
    **extra: Any,
) -> None:
    hub.publish(
        {
            "type": type_,
            "userId": user_id,
            "departmentId": department_id,
            "complaintId": complaint_id,
            "channels": channels or [],
            **extra,
        }
    )
