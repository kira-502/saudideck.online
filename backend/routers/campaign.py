import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/campaign", tags=["campaign"])

SUBS_URL = os.environ.get("SUBS_API_URL", "https://subs.saudideck.online/api/subscriptions")
SUBS_AUTH = (os.environ.get("SUBS_API_USER", "admin"), os.environ.get("SUBS_API_PASS", "SaudiDeck2026"))
WA_TOKEN = os.environ.get("WA_TOKEN", "")
WA_PHONE_ID = os.environ.get("WA_PHONE_ID", "")
TEMPLATE_NAME = "eid_campaign_active"
TEMPLATE_LANG = "en"


def _get_db():
    yield from get_db()


class SendBody(BaseModel):
    phone: str
    name: str
    expiry_date: str


@router.get("/debug-templates")
async def debug_templates(
    current_user: models.User = Depends(get_current_user),
):
    waba_id = "765380093093659"
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"https://graph.facebook.com/v22.0/{waba_id}/message_templates",
            headers={"Authorization": f"Bearer {WA_TOKEN}"},
            params={"fields": "name,status,language", "limit": 20},
        )
        return resp.json()


@router.get("/subscribers")
async def get_subscribers(
    current_user: models.User = Depends(get_current_user),
):
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(SUBS_URL, auth=SUBS_AUTH)
        resp.raise_for_status()
    return resp.json()


@router.post("/send")
async def send_message(
    body: SendBody,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not WA_TOKEN or not WA_PHONE_ID:
        raise HTTPException(status_code=500, detail="WA_TOKEN or WA_PHONE_ID not configured")

    payload = {
        "messaging_product": "whatsapp",
        "to": body.phone,
        "type": "template",
        "template": {
            "name": TEMPLATE_NAME,
            "language": {"code": TEMPLATE_LANG},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": body.name},
                        {"type": "text", "text": body.expiry_date},
                    ],
                }
            ],
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"https://graph.facebook.com/v22.0/{WA_PHONE_ID}/messages",
            headers={"Authorization": f"Bearer {WA_TOKEN}", "Content-Type": "application/json"},
            json=payload,
        )
        data = resp.json()

    success = resp.status_code == 200 and "messages" in data
    error_msg = data.get("error", {}).get("message", "") if not success else ""

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="whatsapp_sent" if success else "whatsapp_failed",
        resource="campaign",
        detail=f"phone={body.phone} name={body.name} {'ok' if success else error_msg}",
        ip=request.client.host if request.client else None,
    )

    if not success:
        raise HTTPException(status_code=resp.status_code, detail=error_msg or "Failed to send")

    return {"ok": True}
