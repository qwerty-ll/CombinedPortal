"""Fill a local portal with demo content (announcements, FAQ, forum questions, adaptation progress).

Needs the backend on http://127.0.0.1:8000 and the fake EIOS (demo_eios.py) for the student accounts.
Run: python3 scripts/demo/seed_demo.py <ADMIN_USERNAME> <ADMIN_PASSWORD>
"""
import json
import sys
import urllib.request
from http.cookiejar import CookieJar

API = "http://127.0.0.1:8000/api/v1"


def session():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))


def call(opener, method, path, body=None):
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
    )
    with opener.open(req) as resp:
        return json.loads(resp.read() or b"null")


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    admin = session()
    call(admin, "POST", "/auth/admin-login", {"username": sys.argv[1], "password": sys.argv[2]})
    for a in [
        {"title": "Посвящение в студенты ИВИТШ", "content": "Ждём всех первокурсников 3 октября в 17:00 в коворкинге на 4 этаже корпуса Б.", "is_important": True},
        {"title": "Изменение расписания на неделе 6–10 октября", "content": "Лекции по высшей математике у групп 25-ИСбо-1 и 25-ИВТбо-1 переносятся в аудиторию Б-214.", "is_important": False},
        {"title": "Открыт набор в клуб спортивного программирования", "content": "Первое занятие — среда, 18:00, Б-305. Опыт не нужен.", "is_important": False},
    ]:
        call(admin, "POST", "/admin/announcements", a)
    for i, (q, ans) in enumerate([
        ("Где получить студенческий билет?", "В дирекции ИВИТШ, кабинет Б-209, с понедельника по пятницу с 9:00 до 17:00."),
        ("Как войти в ЭИОС?", "Логин и пароль выдаёт куратор в первую неделю учёбы. Логин имеет вид 25-isbo-001."),
        ("Когда платят стипендию?", "Академическая стипендия приходит на карту до 25 числа каждого месяца."),
    ], 1):
        call(admin, "POST", "/admin/faq", {"question": q, "answer": ans, "category": "Общие", "order_index": i})

    student = session()
    call(student, "POST", "/auth/eios-login", {"username": "25-isbo-011", "password": "demo"})
    q1 = call(student, "POST", "/forum/questions", {"title": "Где найти аудиторию Б-305?", "category": "Учеба", "content": "Первый раз в корпусе Б, не могу найти 305 кабинет. Это третий этаж?"})
    call(student, "POST", "/forum/questions", {"title": "Кто уже сдавал зачёт по Python?", "category": "Учеба", "content": "Расскажите, что спрашивают на зачёте и сколько лабораторных нужно сдать."})
    call(student, "POST", "/forum/questions", {"title": "Есть ли в корпусе Б столовая?", "category": "Жизнь", "content": "Где можно быстро поесть между парами?"})
    call(student, "POST", f"/forum/questions/{q1['id']}/answers", {"content": "Да, третий этаж, направо от лестницы."})
    call(student, "POST", "/adaptation", {"completed_steps": [0, 1, 2, 3]})
    print("Готово: 3 объявления, 3 вопроса FAQ, 3 вопроса на форуме, прогресс студента 25-isbo-011.")


if __name__ == "__main__":
    main()
