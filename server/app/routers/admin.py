from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
import app.models as models
import app.schemas as schemas
import app.core.security as security

router = APIRouter(prefix="/api/v1", tags=["Admin"])

@router.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(current_user: models.User = Depends(security.require_admin), db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()

@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    req: schemas.RoleUpdateSchema,
    current_user: models.User = Depends(security.require_admin),
    db: Session = Depends(get_db)
):
    if req.role not in ("student", "moderator", "admin"):
        raise HTTPException(status_code=400, detail="Недопустимая роль. Используйте: student, moderator, admin")
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if target_user.id == current_user.id or target_user.username.lower() == current_user.username.lower():
        raise HTTPException(status_code=400, detail="Нельзя изменить собственную роль администратора")

    if target_user.username.lower() in ("ivitsh_admin", "admin", "smirnovmakar"):
        raise HTTPException(status_code=400, detail="Нельзя изменять роль Главного Администратора ИВИТШ")

    target_user.role = req.role
    db.commit()
    db.refresh(target_user)
    return target_user

# --- Teachers ---
@router.get("/teachers", response_model=List[schemas.TeacherResponse])
def get_teachers(db: Session = Depends(get_db)):
    return db.query(models.Teacher).all()

@router.post("/admin/teachers", response_model=schemas.TeacherResponse)
def create_teacher(t_in: schemas.TeacherCreate, current_user: models.User = Depends(security.require_admin), db: Session = Depends(get_db)):
    new_t = models.Teacher(**t_in.dict())
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t

@router.delete("/admin/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, current_user: models.User = Depends(security.require_admin), db: Session = Depends(get_db)):
    t = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if t:
        db.delete(t)
        db.commit()
    return {"status": "deleted"}

# --- Announcements ---
@router.get("/announcements", response_model=List[schemas.AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

@router.post("/admin/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(a_in: schemas.AnnouncementCreate, current_user: models.User = Depends(security.require_admin), db: Session = Depends(get_db)):
    new_a = models.Announcement(**a_in.dict())
    db.add(new_a)
    db.commit()
    db.refresh(new_a)
    return new_a

@router.delete("/admin/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, current_user: models.User = Depends(security.require_admin), db: Session = Depends(get_db)):
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if a:
        db.delete(a)
        db.commit()
    return {"status": "deleted"}

# --- FAQ ---
@router.get("/faq", response_model=List[schemas.FaqItemResponse])
def get_faq_items(db: Session = Depends(get_db)):
    return db.query(models.FaqItem).order_by(models.FaqItem.order_index.asc()).all()

@router.post("/admin/faq", response_model=schemas.FaqItemResponse)
def create_faq_item(f_in: schemas.FaqItemCreate, current_user: models.User = Depends(security.require_admin), db: Session = Depends(get_db)):
    new_f = models.FaqItem(**f_in.dict())
    db.add(new_f)
    db.commit()
    db.refresh(new_f)
    return new_f

@router.delete("/admin/faq/{faq_id}")
def delete_faq_item(faq_id: int, current_user: models.User = Depends(security.require_admin), db: Session = Depends(get_db)):
    f = db.query(models.FaqItem).filter(models.FaqItem.id == faq_id).first()
    if f:
        db.delete(f)
        db.commit()
    return {"status": "deleted"}
