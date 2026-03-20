from typing import Optional
import asyncio
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/game-requests", tags=["game-requests"])

VALID_STATUSES = {"pending", "has_deal", "added", "no_deal"}
PAGE_SIZE = 50


def _get_db():
    yield from get_db()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class GameRequestSubmit(BaseModel):
    game: str
    order_number: Optional[str] = None

    @field_validator("game")
    @classmethod
    def game_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("game is required")
        if len(v) > 200:
            raise ValueError("game name must be 200 characters or fewer")
        return v

    @field_validator("order_number")
    @classmethod
    def order_number_max(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip() or None
            if v and len(v) > 50:
                raise ValueError("order_number must be 50 characters or fewer")
        return v


class GameRequestUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(VALID_STATUSES))}")
        return v


class SteamLinkBody(BaseModel):
    app_id: str
    name: str
    url: str
    price_uah: Optional[float] = None
    price_sar: Optional[float] = None
    discount: Optional[int] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(r: models.GameRequest) -> dict:
    return {
        "id": r.id,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "game_name": r.game_name,
        "order_number": r.order_number,
        "status": r.status,
        "notes": r.notes,
        "steam_app_id": r.steam_app_id,
        "steam_name": r.steam_name,
        "steam_url": r.steam_url,
        "steam_price_uah": r.steam_price_uah,
        "steam_price_sar": r.steam_price_sar,
        "steam_discount": r.steam_discount,
    }


# ── Public endpoint (no auth) ─────────────────────────────────────────────────

@router.post("", include_in_schema=True)
def submit_game_request(
    body: GameRequestSubmit,
    request: Request,
    db: Session = Depends(_get_db),
):
    try:
        gr = models.GameRequest(
            game_name=body.game,
            order_number=body.order_number,
            status="pending",
        )
        db.add(gr)
        db.commit()
        db.refresh(gr)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to save game request")

    log_action(
        db,
        action="game_request_submitted",
        detail=body.game,
        ip=request.client.host if request.client else None,
    )

    return {"ok": True}


# ── Admin endpoints (auth required) ──────────────────────────────────────────

@router.get("")
def list_game_requests(
    status: Optional[str] = None,
    page: int = 1,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.GameRequest)
    if status:
        q = q.filter(models.GameRequest.status == status)
    total = q.count()
    items = (
        q.order_by(models.GameRequest.created_at.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "pages": max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE),
        "items": [_serialize(r) for r in items],
    }


@router.get("/steam-search")
async def steam_search(
    q: str,
    current_user: models.User = Depends(get_current_user),
):
    """Search Steam Ukraine store and return up to 5 results with UAH + SAR prices."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Search Steam store
        search_resp = await client.get(
            "https://store.steampowered.com/api/storesearch/",
            params={"term": q, "l": "english", "cc": "UA"},
        )
        search_resp.raise_for_status()
        search_data = search_resp.json()

    items = (search_data.get("items") or [])[:5]
    if not items:
        return []

    # 2. Fetch exchange rate UAH → SAR (open.er-api.com supports UAH)
    sar_rate: Optional[float] = None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            fx_resp = await client.get(
                "https://open.er-api.com/v6/latest/UAH",
            )
            fx_resp.raise_for_status()
            fx_data = fx_resp.json()
            sar_rate = fx_data.get("rates", {}).get("SAR")
    except Exception:
        sar_rate = None

    # 3. Fetch app details concurrently
    app_ids = [str(item["id"]) for item in items]

    async def fetch_details(app_id: str):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://store.steampowered.com/api/appdetails",
                    params={"appids": app_id, "cc": "UA", "l": "english"},
                )
                resp.raise_for_status()
                return app_id, resp.json()
        except Exception:
            return app_id, None

    detail_results = await asyncio.gather(*[fetch_details(aid) for aid in app_ids])
    details_map = {aid: data for aid, data in detail_results}

    # 4. Build response
    results = []
    for item in items:
        app_id = str(item["id"])
        name = item.get("name", "")
        url = f"https://store.steampowered.com/app/{app_id}"

        detail_data = details_map.get(app_id)
        is_free = False
        not_available = False
        price_uah: Optional[float] = None
        price_sar: Optional[float] = None
        discount_percent: int = 0

        if detail_data and detail_data.get(app_id, {}).get("success"):
            app_info = detail_data[app_id]["data"]
            if app_info.get("is_free"):
                is_free = True
                price_uah = 0.0
                price_sar = 0.0
            else:
                price_overview = app_info.get("price_overview")
                if price_overview:
                    # Steam returns price in minor units (kopecks), divide by 100
                    raw = price_overview.get("final", 0)
                    price_uah = round(raw / 100, 2)
                    if sar_rate is not None:
                        price_sar = round(price_uah * sar_rate, 2)
                    discount_percent = price_overview.get("discount_percent", 0)
                else:
                    not_available = True
        else:
            not_available = True

        results.append({
            "app_id": app_id,
            "name": name,
            "url": url,
            "price_uah": price_uah,
            "price_sar": price_sar,
            "is_free": is_free,
            "not_available": not_available,
            "discount_percent": discount_percent,
        })

    return results


@router.patch("/{request_id}/steam")
def link_steam(
    request_id: int,
    body: SteamLinkBody,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    gr = db.query(models.GameRequest).filter(models.GameRequest.id == request_id).first()
    if not gr:
        raise HTTPException(status_code=404, detail="Game request not found")

    gr.steam_app_id = body.app_id
    gr.steam_name = body.name
    gr.steam_url = body.url
    gr.steam_price_uah = body.price_uah
    gr.steam_price_sar = body.price_sar
    gr.steam_discount = body.discount

    db.commit()
    db.refresh(gr)

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="game_request_steam_linked",
        resource="game_requests",
        detail=f"id={request_id} steam_app_id={body.app_id}",
        ip=request.client.host if request.client else None,
    )

    return _serialize(gr)


@router.delete("/{request_id}")
def delete_game_request(
    request_id: int,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    gr = db.query(models.GameRequest).filter(models.GameRequest.id == request_id).first()
    if not gr:
        raise HTTPException(status_code=404, detail="Game request not found")

    db.delete(gr)
    db.commit()

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="game_request_deleted",
        resource="game_requests",
        detail=f"id={request_id} game_name={gr.game_name}",
        ip=request.client.host if request.client else None,
    )

    return {"ok": True}


@router.patch("/{request_id}")
def update_game_request(
    request_id: int,
    body: GameRequestUpdate,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    gr = db.query(models.GameRequest).filter(models.GameRequest.id == request_id).first()
    if not gr:
        raise HTTPException(status_code=404, detail="Game request not found")

    changes = []
    if body.status is not None:
        changes.append(f"status: {gr.status} → {body.status}")
        gr.status = body.status
    if body.notes is not None:
        gr.notes = body.notes
        changes.append("notes updated")

    db.commit()
    db.refresh(gr)

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="game_request_updated",
        resource="game_requests",
        detail=f"id={request_id} " + "; ".join(changes),
        ip=request.client.host if request.client else None,
    )

    return _serialize(gr)
