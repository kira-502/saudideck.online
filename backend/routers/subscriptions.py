import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from auth import get_current_user
from audit import log_action
from database import get_db
from sqlalchemy.orm import Session
import models
import os

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

SUBS_URL = os.environ.get("SUBS_API_URL", "https://subs.saudideck.online/api/subscriptions")
SUBS_AUTH = (
    os.environ.get("SUBS_API_USER", "admin"),
    os.environ.get("SUBS_API_PASS", "SaudiDeck2026"),
)


@router.get("")
def get_subscriptions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        resp = httpx.get(SUBS_URL, auth=SUBS_AUTH, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Subscriptions service error: {e}")

    # Compute stats
    active = [s for s in data if s.get("status") == "active"]
    expiring = [s for s in data if s.get("status") == "expiring"]
    expired = [s for s in data if s.get("status") == "expired"]
    cancelled = [s for s in data if s.get("status") == "cancelled"]

    total_revenue = sum(s.get("price", 0) for s in active)

    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_subscriptions", ip=request.client.host if request.client else None)

    return {
        "stats": {
            "total": len(data),
            "active": len(active),
            "expiring": len(expiring),
            "expired": len(expired),
            "cancelled": len(cancelled),
            "active_revenue": total_revenue,
        },
        "subscriptions": data,
    }
