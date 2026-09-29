"""Documents ВИТШик prepares for a signed-in student: an explanatory note and a retake request (DOCX or PDF)."""
from datetime import date
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from app.core import rate_limit
from app.services import document_drafts, documents, timetable
import app.models as models
import app.schemas as schemas
import app.core.security as security

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

_MEDIA = {
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pdf": "application/pdf",
}
Format = Literal["docx", "pdf"]


def _limit(user: models.User) -> None:
    if not rate_limit.document_requests.hit(f"user:{user.id}"):
        raise rate_limit.too_many_requests("Слишком много документов подряд. Подожди минутку.")


def _person(req: schemas.DocumentPerson) -> documents.Person:
    return documents.Person(
        full_name=documents.clean_text(req.full_name, 120),
        group=documents.clean_text(req.group, 50),
        course=req.course,
    )


def _file(paper: documents.Paper, fmt: str) -> Response:
    content = documents.render_docx(paper) if fmt == "docx" else documents.render_pdf(paper)
    name = f"{paper.file_stem}.{fmt}"
    return Response(
        content=content,
        media_type=_MEDIA[fmt],
        headers={
            # ASCII fallback first, the Russian name for browsers that read filename*
            "Content-Disposition": f"attachment; filename=\"document.{fmt}\"; filename*=UTF-8''{quote(name)}",
            "Cache-Control": "no-store",
        },
    )


@router.get("/pairs")
async def pairs_of_day(
    day: date = Query(..., alias="date"),
    user: models.User = Depends(security.require_current_user),
):
    """The student's group pairs on a day: the list of missed classes in an explanatory note."""
    try:
        return {"pairs": await document_drafts.pairs_on(user, day)}
    except timetable.TimetableUnavailable:
        raise HTTPException(status_code=503, detail="Расписание ЭИОС сейчас недоступно, пары можно не указывать.")


@router.post("/explanatory")
def explanatory_note(
    req: schemas.ExplanatoryIn,
    fmt: Format = Query("docx", alias="format"),
    user: models.User = Depends(security.require_current_user),
):
    _limit(user)
    today = timetable.msk_now().date()
    last = req.date_to if req.date_to and req.date_to != req.date_from else None
    if last and last < req.date_from:
        raise HTTPException(status_code=422, detail="Дата окончания раньше даты начала")
    if last and (last - req.date_from).days > 62:
        raise HTTPException(status_code=422, detail="Период пропуска больше двух месяцев: проверьте даты")
    if abs((req.date_from - today).days) > 400:
        raise HTTPException(status_code=422, detail="Проверьте дату пропуска")
    pairs = [
        documents.MissedPair(p.start, p.end, documents.clean_text(p.discipline, 200),
                             documents.clean_text(p.kind, 40), documents.clean_text(p.teacher, 100))
        for p in req.pairs
    ] if not last else []
    paper = documents.explanatory_note(
        _person(req), req.date_from, last, documents.clean_text(req.reason, 300), pairs,
        documents.clean_text(req.attachment, 200), today,
    )
    return _file(paper, fmt)


@router.post("/retake")
def retake_request(
    req: schemas.RetakeIn,
    fmt: Format = Query("docx", alias="format"),
    user: models.User = Depends(security.require_current_user),
):
    _limit(user)
    paper = documents.retake_request(
        _person(req), documents.clean_text(req.discipline, 200), req.control,
        documents.clean_text(req.teacher, 100), documents.clean_text(req.reason, 300), timetable.msk_now().date(),
    )
    return _file(paper, fmt)
