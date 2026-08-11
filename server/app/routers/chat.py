from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
import app.models as models
import app.schemas as schemas
from app.services.rag_service import generate_chatbot_reply

router = APIRouter(prefix="/api/v1/chat", tags=["Chatbot"])

@router.post("", response_model=schemas.ChatResponse)
def chat_with_mascot(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    history_list = [h.dict() for h in (req.history or [])]
    reply = generate_chatbot_reply(req.message, history_list, db)
    return schemas.ChatResponse(reply=reply)

@router.get("/top-questions", response_model=List[str])
def get_top_analytics_questions(db: Session = Depends(get_db)):
    top = db.query(models.AnalyticsQuestion).order_by(models.AnalyticsQuestion.ask_count.desc()).limit(5).all()
    if not top:
        return ["Где расписание?", "Как найти 209 кабинет?", "Про стипендию ИВИТШ", "Где коворкинг?"]
    return [q.question_text for q in top]
