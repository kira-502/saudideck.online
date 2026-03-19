import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/emails", tags=["emails"])


def _get_db():
    yield from get_db()


@router.get("")
def list_extractions(
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        rows = (
            db.query(models.EmailExtraction)
            .order_by(models.EmailExtraction.run_at.desc())
            .all()
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not read email_extractions: {e}")

    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_emails", ip=request.client.host if request.client else None)

    return [
        {
            "id": r.id,
            "run_at": r.run_at,
            "triggered_by": r.triggered_by,
            "email_count": r.email_count,
        }
        for r in rows
    ]


@router.get("/{extraction_id}/download")
def download_extraction(
    extraction_id: int,
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    row = db.get(models.EmailExtraction, extraction_id)
    if not row:
        raise HTTPException(status_code=404, detail="Extraction not found")

    raw = row.raw_data or []

    # Build CSV
    output = io.StringIO()
    if raw:
        writer = csv.DictWriter(output, fieldnames=raw[0].keys())
        writer.writeheader()
        writer.writerows(raw)
    else:
        output.write("No data\n")

    output.seek(0)
    filename = f"extraction_{extraction_id}_{row.run_at.strftime('%Y%m%d_%H%M') if row.run_at else 'unknown'}.csv"

    log_action(db, user_id=current_user.id, username=current_user.username,
               action="download_extraction", resource=str(extraction_id),
               ip=request.client.host if request.client else None)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
