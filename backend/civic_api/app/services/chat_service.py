"""Rule-based CivicConnect assistant — helps citizens navigate the portal."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class ChatReply:
    reply: str
    suggestions: list[str]
    links: list[dict[str, str]]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower().strip())


INTENTS: list[tuple[str, list[str]]] = [
    (
        "report",
        [
            r"\breport\b",
            r"\bcomplain\b",
            r"\bfile\b",
            r"\bsubmit\b",
            r"\bnew issue\b",
            r"\bpothole\b",
            r"\bgarbage\b",
            r"\bleak\b",
            r"\bstreet.?light\b",
            r"how (do|can) i report",
        ],
    ),
    (
        "track",
        [
            r"\btrack\b",
            r"\bstatus\b",
            r"\bprogress\b",
            r"\bmy complaint",
            r"\bmy issue",
            r"where is my",
            r"\bupdate\b",
        ],
    ),
    (
        "duplicate",
        [
            r"\bduplicate\b",
            r"\bsimilar\b",
            r"already reported",
            r"\bsupport\b.*(issue|complaint)",
            r"same (issue|problem)",
            r"\bvot(e|ing)\b",
        ],
    ),
    (
        "departments",
        [
            r"\bdepartment\b",
            r"who handles",
            r"which department",
            r"public works",
            r"sanitation",
            r"electricity",
            r"water supply",
            r"\broute\b",
        ],
    ),
    (
        "login",
        [
            r"\blogin\b",
            r"\bsign ?up\b",
            r"\bregister\b",
            r"\baccount\b",
            r"\bpassword\b",
            r"how (do|can) i (sign|log)",
        ],
    ),
    (
        "public",
        [
            r"\bpublic report",
            r"\bcommunity\b",
            r"\bnearby\b",
            r"other people",
            r"see (all|other) complaint",
        ],
    ),
    (
        "priority",
        [
            r"\bpriority\b",
            r"\burgent\b",
            r"\bemergency\b",
            r"how long",
            r"\bsla\b",
        ],
    ),
    (
        "notifications",
        [
            r"\bnotif",
            r"\balert\b",
            r"\bbell\b",
            r"when (do|will) i (get|receive)",
        ],
    ),
    (
        "help",
        [
            r"^\s*help\s*$",
            r"what can you",
            r"\bmenu\b",
            r"\boptions\b",
            r"how (does|do) (this|civic)",
        ],
    ),
    (
        "greeting",
        [
            r"^\s*(hi|hello|hey|good (morning|afternoon|evening))\b",
            r"^\s*namaste\b",
        ],
    ),
]


RESPONSES: dict[str, ChatReply] = {
    "greeting": ChatReply(
        reply=(
            "Hi — I’m the CivicConnect assistant. I can help you report an issue, "
            "track complaints, understand duplicates, or find the right department."
        ),
        suggestions=["How do I report an issue?", "Track my complaints", "What is duplicate detection?"],
        links=[{"label": "Go to dashboard", "path": "/dashboard"}],
    ),
    "help": ChatReply(
        reply=(
            "Here’s what I can help with:\n"
            "• Report a civic issue (photo + map pin)\n"
            "• Track status of your complaints\n"
            "• Explain duplicate detection & community support\n"
            "• Which department handles which problem\n"
            "• Login / signup and public reports"
        ),
        suggestions=["Report an issue", "Track status", "Departments", "Public reports"],
        links=[
            {"label": "Report issue", "path": "/report"},
            {"label": "My complaints", "path": "/my-complaints"},
        ],
    ),
    "report": ChatReply(
        reply=(
            "To report an issue:\n"
            "1. Open Report issue\n"
            "2. Choose a category (road, waste, electricity, water, other)\n"
            "3. Describe what you see and pin the location on the map\n"
            "4. Upload a clear photo, then submit\n\n"
            "If a similar nearby complaint already exists, you’ll review it before supporting."
        ),
        suggestions=["What is duplicate detection?", "Track my complaints", "Which department?"],
        links=[{"label": "Report an issue", "path": "/report"}],
    ),
    "track": ChatReply(
        reply=(
            "You can track complaints from My dashboard or My complaints. "
            "Statuses move: New → In progress → Resolved. "
            "You’ll also get notifications when the department updates status or adds remarks."
        ),
        suggestions=["Open my complaints", "About notifications", "Report an issue"],
        links=[
            {"label": "My dashboard", "path": "/dashboard"},
            {"label": "My complaints", "path": "/my-complaints"},
            {"label": "Notifications", "path": "/notifications"},
        ],
    ),
    "duplicate": ChatReply(
        reply=(
            "If your report matches an open complaint nearby (same category, close location, similar description), "
            "CivicConnect shows that similar issue first.\n\n"
            "You can View details, then Support this issue to add your vote — "
            "or keep editing if it’s truly a different problem. "
            "This avoids duplicate tickets and strengthens community priority."
        ),
        suggestions=["How do I report?", "Track my complaints", "Public reports"],
        links=[
            {"label": "Report issue", "path": "/report"},
            {"label": "Public reports", "path": "/public-reports"},
        ],
    ),
    "departments": ChatReply(
        reply=(
            "Issues are routed automatically:\n"
            "• Public Works — roads, potholes, bridges\n"
            "• Sanitation — garbage, waste, cleanliness\n"
            "• Electricity Board — streetlights, power\n"
            "• Water Supply — leaks, drainage, sewage\n"
            "• General Municipal — other civic issues\n\n"
            "Your description and category help pick the right team."
        ),
        suggestions=["Report an issue", "Track status", "Help"],
        links=[{"label": "Report issue", "path": "/report"}],
    ),
    "login": ChatReply(
        reply=(
            "Citizens sign up or log in from the home page. "
            "Department officers use the Department portal login. "
            "After login, citizens land on My dashboard; officers see their department queue."
        ),
        suggestions=["Report an issue", "How does tracking work?"],
        links=[
            {"label": "Citizen login", "path": "/login"},
            {"label": "Sign up", "path": "/signup"},
        ],
    ),
    "public": ChatReply(
        reply=(
            "Public reports lets you browse community issues, filter by status/category, "
            "and support nearby complaints so departments see shared priority."
        ),
        suggestions=["Support / duplicates", "Report an issue"],
        links=[{"label": "Public reports", "path": "/public-reports"}],
    ),
    "priority": ChatReply(
        reply=(
            "Priority is estimated from your description (urgent words like emergency, flood, danger raise it). "
            "Community support votes also help departments focus. "
            "Exact timelines depend on the assigned department’s workload."
        ),
        suggestions=["Departments", "Track my complaints"],
        links=[{"label": "My dashboard", "path": "/dashboard"}],
    ),
    "notifications": ChatReply(
        reply=(
            "You’ll get notifications when a department changes status or adds remarks on your complaint. "
            "Use the bell in the top bar or open Notifications for the full list."
        ),
        suggestions=["Track my complaints", "Help"],
        links=[{"label": "Notifications", "path": "/notifications"}],
    ),
}

FALLBACK = ChatReply(
    reply=(
        "I can help with reporting issues, tracking status, duplicate detection, departments, "
        "login, and public reports. Try one of the suggestions below — or ask a short question."
    ),
    suggestions=["How do I report an issue?", "Track my complaints", "What is duplicate detection?", "Departments"],
    links=[
        {"label": "Report issue", "path": "/report"},
        {"label": "Help overview", "path": "/dashboard"},
    ],
)


def detect_intent(message: str) -> str | None:
    text = _normalize(message)
    if not text:
        return "help"
    for intent, patterns in INTENTS:
        for pattern in patterns:
            if re.search(pattern, text):
                return intent
    return None


def generate_reply(message: str, *, user_name: str | None = None) -> ChatReply:
    intent = detect_intent(message)
    base = RESPONSES.get(intent or "", FALLBACK)
    reply = base.reply
    if intent == "greeting" and user_name:
        reply = f"Hi {user_name} — I’m the CivicConnect assistant. " + reply.split("— ", 1)[-1]
    return ChatReply(reply=reply, suggestions=list(base.suggestions), links=[dict(x) for x in base.links])
