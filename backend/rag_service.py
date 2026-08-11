import os
import re
import uuid
import time
import requests
import urllib3
from datetime import datetime
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models

load_dotenv()

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CLIENT_ID = os.getenv("GIGACHAT_CLIENT_ID", "019e2c26-97a8-75cf-8d25-1caf90fcdd51")
SECRET = os.getenv("GIGACHAT_SECRET", "MDE5ZTJjMjYtOTdhOC03NWNmLThkMjUtMWNhZjkwZmNkZDUxOjFkODQ2YzZjLTgwNmEtNGIwZi1iZmQ2LTY0Zjg2NTAwMmU2Yg==")

OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

token_cache = {
    "access_token": "",
    "expires_at": 0
}

def get_access_token() -> str:
    now = time.time()
    if token_cache["access_token"] and now < token_cache["expires_at"] - 60:
        return token_cache["access_token"]

    headers = {
        "Authorization": f"Basic {SECRET}",
        "RqUID": str(uuid.uuid4()),
        "Content-Type": "application/x-www-form-urlencoded",
    }
    payload = {"scope": "GIGACHAT_API_PERS"}

    try:
        resp = requests.post(OAUTH_URL, headers=headers, data=payload, verify=False, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        token_cache["access_token"] = data["access_token"]
        exp_ms = data.get("expires_at")
        token_cache["expires_at"] = (exp_ms / 1000) if exp_ms else (now + 1800)
        return token_cache["access_token"]
    except Exception as e:
        raise RuntimeError(f"GigaChat Auth Failed: {e}")

KNOWLEDGE_CHUNKS = [
    {
        "keywords": ["дирекц", "деканат", "209", "корпус б", "ивановск", "кабинет", "администр", "часы работ"],
        "content": "Дирекция Высшей ИТ-школы (ИВИТШ) КГУ находится в Корпусе Б на 2 этаже, кабинет Б-209. Работает с Пн по Пт с 9:00 до 17:00 (перерыв 12:00-13:00). Адрес Корпуса Б: ул. Ивановская, 24а [IMG:209.png]."
    },
    {
        "keywords": ["стипенд", "деньги", "пгас", "академическ", "социальн", "выплат", "повышенн", "сколько платят"],
        "content": "Академическая стипендия: 3000 руб за сессию на «4» и «5», 4500 руб за отличную сессию («5»). Повышенная стипендия (ПГАС) — от 5000 до 10000 руб за успехи в науке, спорте и творчестве. Социальная стипендия — 2980 руб."
    },
    {
        "keywords": ["клуб", "объединен", "медиа", "идея", "мафи", "программирован", "nexthub", "играй", "кружок", "досуг"],
        "content": "ВИТШ-медиа (рук. Макар Смирнов), ИДЕЯ (рук. Ирина Горева @KrisBeet), Спортивное программирование (рук. Глеб Лебедев @xeGalaxy), NextHub (рук. Денислав Чеботарев), Играй (рук. Василиса Никитина), Кибербезопасность (@SNEWYEWRS), Спортивная мафия (рук. Владислав Смирнов)."
    },
    {
        "keywords": ["аудитор", "кабинет", "301", "101", "102", "104", "107", "108", "201", "202", "203", "204", "206", "207", "208", "209", "302", "303", "304", "306", "307", "308", "309", "310", "312", "313", "401", "403", "406", "407", "408", "409", "коворкинг", "этаж", "преподавательск"],
        "content": "Аудитория 301 и все 300-е аудитории (301-313) находятся на 3 этаже Корпуса Б (ул. Ивановская, 24а). 100-е аудитории — 1 этаж. 200-е — 2 этаж (включая Б-209) [IMG:209.png]. 400-е — 4 этаж. Коворкинг ВИТШ находится на 4 этаже Корпуса Б [IMG:coworking.png]."
    },
    {
        "keywords": ["кушать", "поесть", "еда", "столовая", "обед", "кофе", "магазин", "шаурма", "голоден", "перекус"],
        "content": "Рядом с Корпусом Б можно покушать: столовая «Жуй да Ешь» (от 100р, ул. Советская 42/1), Шаурмастер44 (шаурма от 140р, ул. Советская 61/39), «Еда-кафе» (от 150р, ул. Лермонтова 3/1), Coffee Like (Советская 26/1), магазины Пятерочка (Советская 47) и Высшая лига."
    },
    {
        "keywords": ["староста", "куратор", "тьютор", "профорг", "культорг", "лекция", "лабораторн", "семинар", "дифзачет", "сдо", "еиос", "зачетка", "расписан"],
        "content": "Староста: студент-лидер группы. Куратор: преподаватель-наставник. Тьютор: старшекурсник-помощник. Профорг: защита прав, матпомощь. СДО: платформа с тестами (sdo.kosgos.ru). ЭИОС: расписание и портфолио (eios.kosgos.ru)."
    }
]

def evaluate_query(query: str):
    q_lower = query.lower().strip()
    q_words = re.findall(r"\w{2,}", q_lower)

    # 1. Exact match for classroom numbers (101-409)
    room_match = re.search(r"\b(101|102|104|107|108|201|202|203|204|206|207|208|209|301|302|303|304|306|307|308|309|310|312|313|401|403|406|407|408|409)\b", q_lower)
    if room_match:
        room_num = room_match.group(1)
        floor_map = {'1': '1 этаже', '2': '2 этаже', '3': '3 этаже', '4': '4 этаже'}
        floor = floor_map.get(room_num[0], 'соответствующем этаже')
        extra = ' (Дирекция ИВИТШ КГУ)' if room_num == '209' else ''
        return 100, {
            "keywords": [room_num],
            "content": f"Аудитория {room_num}{extra} находится на **{floor} Корпуса Б** (ул. Ивановская, 24а).\n\n[IMG:{room_num}.png]"
        }

    # 2. Food query direct match
    if any(k in q_lower for k in ("поесть", "голоден", "столов", "еда", "шаурм", "обед")):
        return 100, KNOWLEDGE_CHUNKS[4]

    best_match = None
    max_score = 0

    stop_words = {"где", "как", "находиться", "находится", "какой", "какая", "пожалуйста"}

    for chunk in KNOWLEDGE_CHUNKS:
        score = 0
        for kw in chunk["keywords"]:
            if kw in q_lower:
                if re.match(r"^\d{3}$", kw):
                    score += 35
                else:
                    score += 8
        for w in q_words:
            if w not in stop_words and len(w) >= 3 and w in chunk["content"].lower():
                score += 2
        if score > max_score:
            max_score = score
            best_match = chunk

    return max_score, best_match

def track_question_analytics(query_text: str, db: Session):
    try:
        clean_text = query_text.strip()
        if len(clean_text) < 3 or len(clean_text) > 100:
            return
        
        item = db.query(models.AnalyticsQuestion).filter(models.AnalyticsQuestion.question_text == clean_text).first()
        if item:
            item.ask_count += 1
            item.last_asked = datetime.utcnow()
        else:
            item = models.AnalyticsQuestion(question_text=clean_text, ask_count=1)
            db.add(item)
        db.commit()
    except Exception as e:
        db.rollback()

def generate_chatbot_reply(user_message: str, history: list, db: Session) -> str:
    score, chunk = evaluate_query(user_message)

    # Reject off-topic queries strictly
    if score < 4 or not chunk:
        return "Я — цифровой маскот ВИТШик и отвечаю исключительно на вопросы про Высшую ИТ-Школу КГУ, аудитории, расписание, стипендии, клубы и учебу! 😸 Задай мне вопрос по университету!"

    # Log analytics
    track_question_analytics(user_message, db)

    system_prompt = (
        "Ты — маскот ВИТШик. Отвечай СТРОГО И ИСКЛЮЧИТЕЛЬНО на основе предоставленного текста ниже.\n\n"
        "ПРАВИЛА:\n"
        "1. ОТВЕЧАЙ ЕСТЕСТВЕННО И ДРУЖЕЛЮБНО (1-3 коротких предложения).\n"
        "2. ЗАПРЕЩЕНО добавлять любые факты, отсутствующие в тексте ниже.\n"
        "3. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать технические теги вида [SMILEY_...], [EMOJI_...] или вымышленные сведения.\n"
        "4. ЕСЛИ СПРАШИВАЮТ про аудиторию или коворкинг, сохрани тег изображения [IMG:...].\n\n"
        "Текст для ответа:\n"
        f"{chunk['content']}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    for turn in (history or [])[-4:]:
        role = turn.get("role")
        content = turn.get("content", "")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    try:
        token = get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "GigaChat",
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 250
        }
        resp = requests.post(CHAT_URL, headers=headers, json=payload, verify=False, timeout=15)
        resp.raise_for_status()
        reply = resp.json()["choices"][0]["message"]["content"]

        reply = re.sub(r'\[SMILEY_.*?\]', '', reply, flags=re.IGNORECASE)
        reply = re.sub(r'\[EMOJI_.*?\]', '', reply, flags=re.IGNORECASE)
        reply = re.sub(r'\[TAG_.*?\]', '', reply, flags=re.IGNORECASE)
        reply = re.sub(r'[\U00010000-\U0010ffff]', '', reply).strip()

        return reply if reply else chunk["content"]
    except Exception as e:
        print("GigaChat Error:", e)
        return chunk["content"]
