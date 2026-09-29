import re

from fastapi import APIRouter, HTTPException

from app.services import rooms, timetable

router = APIRouter(prefix="/api/v1/rooms", tags=["Rooms"])

_UNAVAILABLE = "Расписание ЭИОС КГУ сейчас недоступно. Попробуйте позже или откройте eios.kosgos.ru."


@router.get("")
async def get_rooms():
    """Every room of корпус Б with places, computers, OS, equipment and software, and the coworkings."""
    return rooms.data()


@router.get("/{number}/today")
async def get_room_today(number: str):
    """Today's pairs in a room from the EIOS timetable; the client works out "занята" / "свободна до" itself."""
    if not re.fullmatch(r"[1-4]\d{2}", number):
        raise HTTPException(status_code=404, detail="Такой аудитории в корпусе Б нет.")
    today = timetable.msk_now().date()
    try:
        year = timetable.academic_year(today)
        room = await timetable.find_room(f"Б-{number}", year)
        lessons = await timetable.room_lessons(room["id"], year) if room else []
    except timetable.TimetableUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)
    return {
        "date": today.isoformat(),
        "room": f"Б-{number}",
        "in_timetable": room is not None,
        "lessons": [lesson.as_dict() for lesson in lessons if lesson.day == today],
    }
