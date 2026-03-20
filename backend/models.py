from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger, Boolean, Column, Float, ForeignKey, Integer,
    Numeric, String, Text, DateTime, UniqueConstraint, JSON
)
from database import Base


def _now():
    return datetime.now(timezone.utc)


# ── Existing tables (read mirrors) ──────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False, default="employee")
    created_at = Column(DateTime(timezone=True), default=_now)
    last_login = Column(DateTime(timezone=True), nullable=True)


class SallaOrder(Base):
    __tablename__ = "salla_orders"
    id = Column(Integer, primary_key=True)
    order_num = Column(BigInteger, unique=True, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    product = Column(String(300), nullable=False)
    price_sar = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(100), nullable=True)
    imported_at = Column(DateTime(timezone=True), default=_now)


class G2GOrder(Base):
    __tablename__ = "g2g_orders"
    __table_args__ = (UniqueConstraint("order_id", "split_index", name="uq_g2g_order_split"),)
    id = Column(Integer, primary_key=True)
    order_id = Column(String(50), nullable=False)
    split_index = Column(Integer, nullable=False, default=0)
    date = Column(DateTime(timezone=True), nullable=False)
    product = Column(String(500), nullable=False)
    game_name = Column(String(300), nullable=True)
    total_paid_usd = Column(Numeric(10, 4), nullable=True)
    status = Column(String(20), default="Delivered")
    imported_at = Column(DateTime(timezone=True), default=_now)


class PlatiOrder(Base):
    __tablename__ = "plati_orders"
    id = Column(Integer, primary_key=True)
    plati_num = Column(String(50), unique=True, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    product = Column(String(300), nullable=False)
    cost_usdt = Column(Numeric(10, 4), nullable=False)
    imported_at = Column(DateTime(timezone=True), default=_now)


class Z2UOrder(Base):
    __tablename__ = "z2u_orders"
    id = Column(Integer, primary_key=True)
    order_id = Column(String(50), unique=True, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    product = Column(String(500), nullable=False)
    cost_usdt = Column(Numeric(10, 4), nullable=False)
    status = Column(String(20), nullable=True)
    imported_at = Column(DateTime(timezone=True), default=_now)


class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True)
    salla_order_id = Column(Integer, ForeignKey("salla_orders.id"), nullable=False)
    supplier = Column(String(20), nullable=False)
    cost_sar = Column(Numeric(10, 2), nullable=False)
    profit_sar = Column(Numeric(10, 2), nullable=False)
    match_type = Column(String(20), default="manual")
    created_at = Column(DateTime(timezone=True), default=_now)


class ImportLog(Base):
    __tablename__ = "import_log"
    id = Column(Integer, primary_key=True)
    supplier = Column(String(20), nullable=False)
    filename = Column(String(200), nullable=False)
    rows_imported = Column(Integer, nullable=False, default=0)
    imported_at = Column(DateTime(timezone=True), default=_now)


class EmailExtraction(Base):
    __tablename__ = "email_extractions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    run_at = Column(DateTime(timezone=True), nullable=True)
    triggered_by = Column(String(200), nullable=True)
    email_count = Column(Integer, nullable=True)
    raw_data = Column(JSON, nullable=True)


# ── New table: game requests ─────────────────────────────────────────────────

class GameRequest(Base):
    __tablename__ = "game_requests"
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False, index=True)
    game_name = Column(String(200), nullable=False)
    order_number = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, has_deal, added, no_deal
    notes = Column(Text, nullable=True)
    steam_app_id = Column(String(20), nullable=True)
    steam_name = Column(String(200), nullable=True)
    steam_url = Column(String(300), nullable=True)
    steam_price_uah = Column(Float, nullable=True)
    steam_price_sar = Column(Float, nullable=True)


# ── New table: hub audit log ─────────────────────────────────────────────────

class HubAuditLog(Base):
    __tablename__ = "hub_audit_logs"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True), default=_now, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50), nullable=True)          # denormalized for easy display
    action = Column(String(100), nullable=False)          # e.g. "login", "view_orders", "export"
    resource = Column(String(100), nullable=True)         # e.g. "salla_orders", "users"
    detail = Column(Text, nullable=True)                  # free-form detail
    ip_address = Column(String(45), nullable=True)        # IPv4 or IPv6
