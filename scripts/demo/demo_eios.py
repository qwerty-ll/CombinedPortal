"""Fake EIOS for local previews: any login with password "demo" signs in, a realistic week of lessons.

Run: python3 scripts/demo/demo_eios.py   (listens on http://127.0.0.1:9000)
Then set EIOS_BASE_URL=http://127.0.0.1:9000/api in .env and restart the backend.
"""
import json, datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

GROUPS = [{"id": 8540, "name": "24-ИСбо-1", "kurs": 2, "facul": "ИВИТШ"}, {"id": 8541, "name": "25-ИСбо-1", "kurs": 1, "facul": "ИВИТШ"},
          {"id": 8542, "name": "25-ИВТбо-1", "kurs": 1, "facul": "ИВИТШ"}, {"id": 8543, "name": "25-ИБбо-1", "kurs": 1, "facul": "ИВИТШ"}]
TEACHERS = [{"id": 1130, "name": "Киприна Людмила Юрьевна", "kaf": "ИСиТ"}, {"id": 1131, "name": "Барило Илья Иванович", "kaf": "ИСиТ"}]
AUDS = [{"id": 1, "name": "Б-209"}, {"id": 2, "name": "Б-301"}, {"id": 3, "name": "Б-305"}]
SLOTS = [("08:30", "10:00", 1), ("10:10", "11:40", 2), ("12:20", "13:50", 3), ("14:00", "15:30", 4)]
LESSONS = [("лек Алгоритмы и структуры данных", "Барило И.И.", "Б-305"), ("пр Высшая математика", "Красавина М.С.", "Б-214"),
           ("лаб Разработка веб-приложений", "Лустгартен Ю.Л.", "Б-301"), ("лек Основы информационной безопасности", "Орлов А.В.", "Б-209"),
           ("пр Английский язык", "Попова С.В.", "Б-108"), ("лаб Программирование на Python", "Киприна Л.Ю.", "Б-303")]

def week():
    today = datetime.date.today(); mon = today - datetime.timedelta(days=today.weekday())
    out, code = [], 1
    for d in range(6):
        day = mon + datetime.timedelta(days=d)
        for s in range(2 + d % 3):
            start, end, num = SLOTS[s]; dis, prep, aud = LESSONS[(d + s) % len(LESSONS)]
            out.append({"код": code, "дата": f"{day}T00:00:00", "датаНачала": f"{day}T{start}:00", "датаОкончания": f"{day}T{end}:00",
                        "начало": start, "конец": end, "деньНедели": d + 1, "день_недели": ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"][d],
                        "дисциплина": dis, "преподаватель": prep, "аудитория": aud, "группа": "24-ИСбо-1", "номерЗанятия": num, "замена": False})
            code += 1
    return out

class H(BaseHTTPRequestHandler):
    def _send(self, obj):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json; charset=utf-8"); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/Rasp/ListYears": return self._send({"data": {"years": ["2025-2026", "2026-2027"]}, "state": 1})
        if path == "/api/raspGrouplist": return self._send({"data": GROUPS, "state": 1})
        if path == "/api/raspTeacherlist": return self._send({"data": TEACHERS, "state": 1})
        if path == "/api/raspAudlist": return self._send({"data": AUDS, "state": 1})
        if path == "/api/Rasp": return self._send({"data": {"rasp": week(), "info": {}}, "state": 1, "msg": "Расписание"})
        self.send_response(404); self.end_headers()
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if body.get("password") == "demo":
            return self._send({"state": 1, "accessToken": "x", "data": {"user": {"userID": 777, "fullName": "Смирнова Анна Павловна", "login": body["userName"]}}})
        self._send({"state": -1})
    def log_message(self, *a): pass

HTTPServer(("127.0.0.1", 9000), H).serve_forever()
