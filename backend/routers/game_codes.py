from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import models
from database import get_db
from auth import get_current_user
from audit import log_action

router = APIRouter(prefix="/game-codes")


def _get_db():
    yield from get_db()


def _serialize(r):
    return {
        "id": r.id,
        "added_at": r.added_at.isoformat(),
        "game_name": r.game_name,
        "code": r.code,
        "status": r.status,
        "sent_to_name": r.sent_to_name,
        "sent_to_phone": r.sent_to_phone,
        "sent_to_order": r.sent_to_order,
        "sent_at": r.sent_at.isoformat() if r.sent_at else None,
        "notes": r.notes,
    }


@router.get("")
def list_codes(
    status: Optional[str] = None,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.GameCode).order_by(models.GameCode.added_at.desc())
    if status:
        q = q.filter(models.GameCode.status == status)
    return [_serialize(r) for r in q.all()]


class AddCodeBody(BaseModel):
    game_name: str
    code: str
    notes: Optional[str] = None


@router.post("")
def add_code(
    body: AddCodeBody,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = models.GameCode(
        added_at=datetime.now(timezone.utc),
        game_name=body.game_name.strip(),
        code=body.code.strip(),
        notes=body.notes,
    )
    db.add(rec)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This code is already in the library for this game")
    db.refresh(rec)

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="game_code_added",
        resource="game_codes",
        detail=f"game={body.game_name} id={rec.id}",
        ip=request.client.host if request.client else None,
    )
    return _serialize(rec)


class MarkSentBody(BaseModel):
    sent_to_name: str
    sent_to_phone: str
    sent_to_order: str


@router.patch("/{code_id}/send")
def mark_sent(
    code_id: int,
    body: MarkSentBody,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = db.query(models.GameCode).filter(models.GameCode.id == code_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Code not found")
    if rec.status == "sent":
        raise HTTPException(status_code=400, detail="Code already sent")

    rec.status = "sent"
    rec.sent_to_name = body.sent_to_name.strip()
    rec.sent_to_phone = body.sent_to_phone.strip()
    rec.sent_to_order = body.sent_to_order.strip()
    rec.sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rec)

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="game_code_sent",
        resource="game_codes",
        detail=f"id={code_id} game={rec.game_name} to={rec.sent_to_name} order={rec.sent_to_order}",
        ip=request.client.host if request.client else None,
    )
    return _serialize(rec)


@router.delete("/{code_id}")
def delete_code(
    code_id: int,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = db.query(models.GameCode).filter(models.GameCode.id == code_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Code not found")

    db.delete(rec)
    db.commit()

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="game_code_deleted",
        resource="game_codes",
        detail=f"id={code_id} game={rec.game_name}",
        ip=request.client.host if request.client else None,
    )
    return {"ok": True}
