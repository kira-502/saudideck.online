from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/orders", tags=["orders"])
PAGE_SIZE = 50


def _get_db():
    """Thin wrapper so patch('routers.orders._get_db', ...) is picked up at call-time."""
    yield from get_db()


def paginate(query, page: int):
    return query.offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()


@router.get("/salla")
def list_salla(
    request: Request,
    page: int = Query(1, ge=1),
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(models.SallaOrder).count()
    rows = paginate(
        db.query(models.SallaOrder).order_by(models.SallaOrder.date.desc()), page
    )
    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_orders", resource="salla_orders",
               detail=f"page={page}", ip=request.client.host if request.client else None)
    return {
        "total": total, "page": page, "page_size": PAGE_SIZE,
        "items": [
            {"id": r.id, "order_num": r.order_num, "date": r.date,
             "product": r.product, "price_sar": float(r.price_sar),
             "payment_method": r.payment_method}
            for r in rows
        ],
    }


@router.get("/g2g")
def list_g2g(
    request: Request,
    page: int = Query(1, ge=1),
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(models.G2GOrder).count()
    rows = paginate(
        db.query(models.G2GOrder).order_by(models.G2GOrder.date.desc()), page
    )
    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_orders", resource="g2g_orders",
               detail=f"page={page}", ip=request.client.host if request.client else None)
    return {
        "total": total, "page": page, "page_size": PAGE_SIZE,
        "items": [
            {"id": r.id, "order_id": r.order_id, "date": r.date,
             "product": r.product, "game_name": r.game_name,
             "total_paid_usd": float(r.total_paid_usd) if r.total_paid_usd else None,
             "status": r.status}
            for r in rows
        ],
    }


@router.get("/plati")
def list_plati(
    request: Request,
    page: int = Query(1, ge=1),
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(models.PlatiOrder).count()
    rows = paginate(
        db.query(models.PlatiOrder).order_by(models.PlatiOrder.date.desc()), page
    )
    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_orders", resource="plati_orders",
               detail=f"page={page}", ip=request.client.host if request.client else None)
    return {
        "total": total, "page": page, "page_size": PAGE_SIZE,
        "items": [
            {"id": r.id, "plati_num": r.plati_num, "date": r.date,
             "product": r.product, "cost_usdt": float(r.cost_usdt)}
            for r in rows
        ],
    }


@router.get("/z2u")
def list_z2u(
    request: Request,
    page: int = Query(1, ge=1),
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(models.Z2UOrder).count()
    rows = paginate(
        db.query(models.Z2UOrder).order_by(models.Z2UOrder.date.desc()), page
    )
    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_orders", resource="z2u_orders",
               detail=f"page={page}", ip=request.client.host if request.client else None)
    return {
        "total": total, "page": page, "page_size": PAGE_SIZE,
        "items": [
            {"id": r.id, "order_id": r.order_id, "date": r.date,
             "product": r.product, "cost_usdt": float(r.cost_usdt), "status": r.status}
            for r in rows
        ],
    }
