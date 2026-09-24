import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
import app.models as models
import app.schemas as schemas
import app.core.security as security

router = APIRouter(prefix="/api/v1", tags=["Adaptation"])


def _parse_steps(adaptation: Optional[models.UserAdaptation]) -> List[int]:
    if not adaptation or not adaptation.completed_steps:
        return [0]
    try:
        steps = json.loads(adaptation.completed_steps)
    except ValueError:
        return [0]
    return sorted({s for s in steps if isinstance(s, int) and 0 <= s < schemas.ADAPTATION_TOTAL_STEPS})


def _to_response(user: models.User, adaptation: Optional[models.UserAdaptation]) -> schemas.UserAdaptationResponse:
    steps = _parse_steps(adaptation)
    return schemas.UserAdaptationResponse(
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        group_number=user.group_number,
        completed_steps=steps,
        progress_percent=round(len(steps) / schemas.ADAPTATION_TOTAL_STEPS * 100.0, 1),
        last_updated=(adaptation.last_updated if adaptation and adaptation.last_updated else user.created_at),
    )


@router.post("/adaptation", response_model=schemas.UserAdaptationResponse)
def save_user_adaptation(
    req: schemas.UserAdaptationUpdate,
    current_user: models.User = Depends(security.require_current_user),
    db: Session = Depends(get_db)
):
    adaptation = current_user.adaptation
    if adaptation is None:
        adaptation = models.UserAdaptation(user_id=current_user.id)
        db.add(adaptation)
    adaptation.completed_steps = json.dumps(req.completed_steps)
    adaptation.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(adaptation)
    return _to_response(current_user, adaptation)


@router.get("/adaptation/me", response_model=schemas.UserAdaptationResponse)
def get_my_adaptation(current_user: models.User = Depends(security.require_current_user)):
    return _to_response(current_user, current_user.adaptation)


@router.get("/admin/adaptations", response_model=List[schemas.UserAdaptationResponse])
def get_student_adaptations(
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    users = (
        db.query(models.User)
        .options(joinedload(models.User.adaptation))
        .order_by(models.User.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [_to_response(u, u.adaptation) for u in users]
