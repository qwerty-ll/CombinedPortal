from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core import rate_limit
import app.models as models
import app.schemas as schemas
import app.core.security as security
from app.services.rag_service import generate_chatbot_reply

router = APIRouter(prefix="/api/v1/chat", tags=["Chatbot"])


@router.post("", response_model=schemas.ChatResponse)
async def chat_with_mascot(
    req: schemas.ChatRequest,
    request: Request,
    current_user: Optional[models.User] = Depends(security.get_current_user),
):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    limiter_key = f"user:{current_user.id}" if current_user else f"ip:{rate_limit.client_ip(request)}"
    if not rate_limit.chat_requests.hit(limiter_key):
        raise rate_limit.too_many_requests("Слишком много сообщений. Подожди минутку 🐱")

    history = [turn.model_dump() for turn in (req.history or [])]
    reply = await generate_chatbot_reply(req.message, history, use_llm=current_user is not None)
    return schemas.ChatResponse(reply=reply)
