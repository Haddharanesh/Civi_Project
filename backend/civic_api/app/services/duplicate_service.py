"""Duplicate complaint detection add-on.

Works for all issue categories (Road, Waste, Electricity, Water, Other).
Uses location radius + category similarity + description text similarity.
"""

from __future__ import annotations

import math
import re
from difflib import SequenceMatcher

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Complaint

# Semantic category buckets — covers form values + legacy DB labels
CATEGORY_GROUPS: dict[str, set[str]] = {
    "road": {
        "road",
        "pothole",
        "street",
        "bridge",
        "footpath",
        "public works",
        "highway",
        "pavement",
    },
    "waste": {
        "waste",
        "garbage",
        "sanitation",
        "cleanliness",
        "trash",
        "dirty",
        "rubbish",
        "dump",
        "litter",
    },
    "electricity": {
        "electricity",
        "streetlight",
        "street light",
        "power",
        "light",
        "electric",
        "transformer",
        "wire",
        "pole",
    },
    "water": {
        "water",
        "drainage",
        "sewage",
        "leakage",
        "pipe",
        "tap",
        "flood",
        "leak",
        "sewer",
    },
    "other": {"other", "general", "municipal", "misc", "miscellaneous"},
}

# Exact form / API category values → group
CATEGORY_ALIASES: dict[str, str] = {
    "road": "road",
    "waste": "waste",
    "electricity": "electricity",
    "water": "water",
    "other": "other",
    "pothole": "road",
    "street": "road",
    "garbage": "waste",
    "sanitation": "waste",
    "streetlight": "electricity",
    "drainage": "water",
    "sewage": "water",
    "general": "other",
}

STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "is", "are",
    "was", "were", "be", "been", "being", "with", "by", "from", "this", "that",
    "it", "its", "as", "near", "please", "very", "there", "here", "my", "our",
}


def _normalize_category(category: str | None) -> str:
    if not category:
        return "other"
    text = category.lower().strip().replace("_", " ").replace("-", " ")
    compact = text.replace(" ", "")
    if text in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[text]
    if compact in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[compact]
    for group, keywords in CATEGORY_GROUPS.items():
        if group in text or group.replace(" ", "") in compact:
            return group
        if any(k in text for k in keywords):
            return group
    return "other"


def _groups_from_text(description: str | None) -> set[str]:
    """Infer category groups from description keywords (all categories)."""
    if not description:
        return set()
    desc = description.lower()
    found: set[str] = set()
    for group, keywords in CATEGORY_GROUPS.items():
        if group == "other":
            continue
        if group in desc or any(k in desc for k in keywords):
            found.add(group)
    return found


def category_groups_for(category: str | None, description: str | None = None) -> set[str]:
    """All category groups that apply to a complaint (selected category + description)."""
    groups = {_normalize_category(category)}
    groups |= _groups_from_text(description)
    return groups or {"other"}


def categories_similar(
    a: str | None,
    b: str | None,
    description_a: str | None = None,
    description_b: str | None = None,
) -> bool:
    """True if any shared category group (works for every issue category)."""
    groups_a = category_groups_for(a, description_a)
    groups_b = category_groups_for(b, description_b)
    return bool(groups_a & groups_b)


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in meters."""
    r = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _tokenize(text: str | None) -> set[str]:
    if not text:
        return set()
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return {t for t in tokens if len(t) > 2 and t not in STOPWORDS}


def description_similarity(a: str | None, b: str | None) -> float:
    """Hybrid similarity: Jaccard on tokens + SequenceMatcher ratio."""
    tokens_a, tokens_b = _tokenize(a), _tokenize(b)
    if tokens_a and tokens_b:
        jaccard = len(tokens_a & tokens_b) / len(tokens_a | tokens_b)
    else:
        jaccard = 0.0

    seq = SequenceMatcher(None, (a or "").lower().strip(), (b or "").lower().strip()).ratio()
    return max(jaccard, seq * 0.85 + jaccard * 0.15)


def find_duplicate_complaint(
    db: Session,
    *,
    description: str,
    category: str,
    latitude: float,
    longitude: float,
    radius_meters: float | None = None,
    text_threshold: float | None = None,
) -> Complaint | None:
    """Return the best matching open complaint across all issue categories."""
    if not settings.duplicate_check_enabled:
        return None

    radius = radius_meters if radius_meters is not None else settings.duplicate_radius_meters
    threshold = (
        text_threshold
        if text_threshold is not None
        else settings.duplicate_text_similarity_threshold
    )

    candidates = (
        db.query(Complaint)
        .filter(Complaint.status.in_(["NEW", "IN_PROGRESS"]))
        .filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None))
        .all()
    )

    new_groups = category_groups_for(category, description)
    best: Complaint | None = None
    best_score = -1.0

    for existing in candidates:
        existing_groups = category_groups_for(existing.category, existing.description)
        same_family = bool(new_groups & existing_groups)

        distance = haversine_meters(latitude, longitude, existing.latitude, existing.longitude)
        if distance > radius:
            continue

        text_score = description_similarity(description, existing.description)

        # Same category family: normal text threshold
        # Cross-category (e.g. OTHER vs ROAD): still allow if text is clearly similar
        needed = threshold if same_family else min(0.85, threshold + 0.25)
        if text_score < needed:
            continue

        distance_factor = 1.0 - (distance / radius)
        category_bonus = 0.12 if same_family else 0.0
        combined = (text_score * 0.65) + (distance_factor * 0.25) + category_bonus
        if combined > best_score:
            best_score = combined
            best = existing

    return best
