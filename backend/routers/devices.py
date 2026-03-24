import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import models
from database import get_db
from auth import get_current_user
from audit import log_action

router = APIRouter(prefix="/devices")


def _get_db():
    yield from get_db()


def _serialize(r):
    return {
        "id": r.id,
        "recorded_at": r.recorded_at.isoformat(),
        "model": r.model,
        "cost_aed": r.cost_aed,
        "aed_to_sar_rate": r.aed_to_sar_rate,
        "cost_sar": r.cost_sar,
        "shipping_sar": r.shipping_sar,
        "sale_price_cash": r.sale_price_cash,
        "sale_price_installment": r.sale_price_installment,
        "profit_cash": r.profit_cash,
        "profit_installment": r.profit_installment,
        "notes": r.notes,
    }


@router.get("/rate")
async def get_aed_to_sar_rate():
    """Fetch live AED → SAR exchange rate."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://api.frankfurter.app/latest?from=AED&to=SAR")
            resp.raise_for_status()
            data = resp.json()
            rate = data["rates"]["SAR"]
            return {"rate": rate}
    except Exception:
        # AED is pegged, fallback
        return {"rate": 1.0219}


@router.get("/records")
def list_records(
    model: Optional[str] = None,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.DevicePriceRecord).order_by(models.DevicePriceRecord.recorded_at.desc())
    if model:
        q = q.filter(models.DevicePriceRecord.model == model)
    return [_serialize(r) for r in q.all()]


class SaveRecordBody(BaseModel):
    model: str
    cost_aed: float
    aed_to_sar_rate: float
    cost_sar: float
    shipping_sar: float
    sale_price_cash: float
    sale_price_installment: float
    profit_cash: float
    profit_installment: float
    notes: Optional[str] = None


@router.post("/records")
def save_record(
    body: SaveRecordBody,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = models.DevicePriceRecord(
        recorded_at=datetime.now(timezone.utc),
        model=body.model,
        cost_aed=body.cost_aed,
        aed_to_sar_rate=body.aed_to_sar_rate,
        cost_sar=body.cost_sar,
        shipping_sar=body.shipping_sar,
        sale_price_cash=body.sale_price_cash,
        sale_price_installment=body.sale_price_installment,
        profit_cash=body.profit_cash,
        profit_installment=body.profit_installment,
        notes=body.notes,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="device_price_saved",
        resource="device_price_records",
        detail=f"model={body.model} cost_aed={body.cost_aed} profit_cash={body.profit_cash}",
        ip=request.client.host if request.client else None,
    )

    return _serialize(rec)


@router.delete("/records/{record_id}")
def delete_record(
    record_id: int,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = db.query(models.DevicePriceRecord).filter(models.DevicePriceRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(rec)
    db.commit()

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="device_price_deleted",
        resource="device_price_records",
        detail=f"id={record_id}",
        ip=request.client.host if request.client else None,
    )

    return {"ok": True}
