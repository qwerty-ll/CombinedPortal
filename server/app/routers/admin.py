from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
import app.models as models
import app.schemas as schemas
import app.core.security as security

router = APIRouter(prefix="/api/v1", tags=["Admin"])


@router.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    return (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    req: schemas.RoleUpdateSchema,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    if req.role not in ("student", "curator", "moderator", "admin"):
        raise HTTPException(status_code=400, detail="Недопустимая роль. Используйте: student, curator, moderator, admin")
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if target_user.id == current_user.id or target_user.username.lower() == current_user.username.lower():
        raise HTTPException(status_code=400, detail="Нельзя изменить собственную роль администратора")

    if target_user.username.lower() in ("ivitsh_admin", "admin"):
        raise HTTPException(status_code=400, detail="Нельзя изменять роль Главного Администратора ИВИТШ")

    target_user.role = req.role
    db.commit()
    db.refresh(target_user)
    return target_user


# --- Teachers ---
@router.get("/teachers", response_model=List[schemas.TeacherResponse])
def get_teachers(
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return db.query(models.Teacher).limit(limit).offset(offset).all()


@router.post("/admin/teachers", response_model=schemas.TeacherResponse)
def create_teacher(
    t_in: schemas.TeacherCreate,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    new_t = models.Teacher(**t_in.dict())
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t


@router.delete("/admin/teachers/{teacher_id}", status_code=200)
def delete_teacher(
    teacher_id: int,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    t = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    db.delete(t)
    db.commit()
    return {"status": "deleted"}


# --- Announcements ---
@router.get("/announcements", response_model=List[schemas.AnnouncementResponse])
def get_announcements(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return (
        db.query(models.Announcement)
        .order_by(models.Announcement.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


@router.post("/admin/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(
    a_in: schemas.AnnouncementCreate,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    new_a = models.Announcement(**a_in.dict())
    db.add(new_a)
    db.commit()
    db.refresh(new_a)
    return new_a


@router.delete("/admin/announcements/{announcement_id}", status_code=200)
def delete_announcement(
    announcement_id: int,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    db.delete(a)
    db.commit()
    return {"status": "deleted"}


@router.put("/admin/announcements/{announcement_id}", response_model=schemas.AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    a_in: schemas.AnnouncementCreate,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    """FIX (A-06): Atomic update endpoint — prevents the delete+create split-brain pattern."""
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    for key, value in a_in.dict().items():
        setattr(a, key, value)
    db.commit()
    db.refresh(a)
    return a


# --- FAQ ---
@router.get("/faq", response_model=List[schemas.FaqItemResponse])
def get_faq_items(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return (
        db.query(models.FaqItem)
        .order_by(models.FaqItem.order_index.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )


@router.post("/admin/faq", response_model=schemas.FaqItemResponse)
def create_faq_item(
    f_in: schemas.FaqItemCreate,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    new_f = models.FaqItem(**f_in.dict())
    db.add(new_f)
    db.commit()
    db.refresh(new_f)
    return new_f


@router.delete("/admin/faq/{faq_id}", status_code=200)
def delete_faq_item(
    faq_id: int,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    f = db.query(models.FaqItem).filter(models.FaqItem.id == faq_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="FAQ элемент не найден")
    db.delete(f)
    db.commit()
    return {"status": "deleted"}


@router.put("/admin/faq/{faq_id}", response_model=schemas.FaqItemResponse)
def update_faq_item(
    faq_id: int,
    f_in: schemas.FaqItemCreate,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    """FIX (A-07): Atomic update endpoint — prevents data loss from delete+create partial failure."""
    f = db.query(models.FaqItem).filter(models.FaqItem.id == faq_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="FAQ элемент не найден")
    for key, value in f_in.dict().items():
        setattr(f, key, value)
    db.commit()
    db.refresh(f)
    return f


# --- Subjects ---
@router.get("/subjects", response_model=List[schemas.SubjectResponse])
def get_subjects(
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return (
        db.query(models.Subject)
        .order_by(models.Subject.semester.asc(), models.Subject.id.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )


@router.post("/admin/subjects", response_model=schemas.SubjectResponse, status_code=201)
def create_subject(
    s_in: schemas.SubjectCreate,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    # FIX: Return 409 Conflict instead of silently upsert-ing an existing subject.
    existing = db.query(models.Subject).filter(models.Subject.subject_code == s_in.subject_code).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Предмет с кодом '{s_in.subject_code}' уже существует. Используйте PUT для обновления."
        )
    new_s = models.Subject(**s_in.dict())
    db.add(new_s)
    db.commit()
    db.refresh(new_s)
    return new_s


@router.put("/admin/subjects/{subject_id}", response_model=schemas.SubjectResponse)
def update_subject(
    subject_id: int,
    s_in: schemas.SubjectCreate,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    s = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    for key, value in s_in.dict().items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/admin/subjects/{subject_id}", status_code=200)
def delete_subject(
    subject_id: int,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    s = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    db.delete(s)
    db.commit()
    return {"status": "deleted"}
