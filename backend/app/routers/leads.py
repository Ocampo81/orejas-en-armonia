from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/leads", tags=["leads"])

@router.post("", response_model=schemas.LeadOut, status_code=201)
def create_lead(payload: schemas.LeadCreate, db: Session = Depends(get_db)):
    lead = models.Lead(
        name=payload.name.strip(),
        whatsapp=payload.whatsapp.strip(),
        message=(payload.message or "").strip(),
        source=(getattr(payload, "source", None) or "landing-orejas-en-armonia").strip(),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.get("", response_model=schemas.LeadPage)
def list_leads(
    q: str | None = Query(None, description="Busca en nombre, whatsapp o mensaje"),
    source: str | None = Query(None, description="Exacto, p.ej. landing-orejas-en-armonia"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    qry = db.query(models.Lead)

    if q:
        like = f"%{q.strip()}%"
        qry = qry.filter(or_(
            models.Lead.name.ilike(like),
            models.Lead.whatsapp.ilike(like),
            models.Lead.message.ilike(like),
        ))

    if source:
        qry = qry.filter(models.Lead.source == source)

    if date_from:
        start_dt = datetime.combine(date_from, datetime.min.time())
        qry = qry.filter(models.Lead.created_at >= start_dt)

    if date_to:
        end_dt = datetime.combine(date_to, datetime.max.time())
        qry = qry.filter(models.Lead.created_at <= end_dt)

    total = qry.count()
    qry = qry.order_by(models.Lead.created_at.desc(), models.Lead.id.desc())
    items = qry.offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size

    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages}
