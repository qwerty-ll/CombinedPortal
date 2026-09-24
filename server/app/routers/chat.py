from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core import rate_limit
from app.db.database import get_db
from app.services import assistant
import app.models as models
import app.schemas as schemas
import app.core.security as security

router = APIRouter(prefix="/api/v1/chat", tags=["Chatbot"])


@router.post("", response_model=schemas.ChatResponse)
async def chat_with_mascot(
    req: schemas.ChatRequest,
    request: Request,
    current_user: Optional[models.User] = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    limiter_key = f"user:{current_user.id}" if current_user else f"ip:{rate_limit.client_ip(request)}"
    if not rate_limit.chat_requests.hit(limiter_key):
        raise rate_limit.too_many_requests("Слишком много сообщений. Подожди минутку 🐱")

    history = [turn.model_dump() for turn in (req.history or [])]
    # Anonymous visitors get answers from portal data only, so the paid API cannot be burned without logging in.
    reply, actions = await assistant.answer(
        req.message, history, current_user, db, group_hint=req.group, use_llm=current_user is not None,
    )
    return schemas.ChatResponse(
        reply=reply,
        actions=[schemas.ChatAction(label=a.label, to=a.to) for a in actions if a.to.startswith("/") and not a.to.startswith("//")],
    )
