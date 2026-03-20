from typing import Optional
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
        "items": [
            {
                "id": r.id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "game_name": r.game_name,
                "order_number": r.order_number,
                "status": r.status,
                "notes": r.notes,
            }
            for r in items
        ],
    }


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

    return {
        "id": gr.id,
        "created_at": gr.created_at.isoformat() if gr.created_at else None,
        "game_name": gr.game_name,
        "order_number": gr.order_number,
        "status": gr.status,
        "notes": gr.notes,
    }
