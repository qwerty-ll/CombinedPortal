import sys
import json
import time
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8008/api/v1"
ADMIN_USER = "system_admin_test"
ADMIN_PASS = "SystemAdminPass2026!"

def log(msg, status="INFO"):
    symbol = "✅" if status == "OK" else "❌" if status == "FAIL" else "ℹ️"
    print(f"[{symbol}] {msg}")

def http_req(endpoint, method="GET", body=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.status
            resp_body = resp.read().decode("utf-8")
            try:
                json_data = json.loads(resp_body) if resp_body else {}
            except Exception:
                json_data = resp_body
            return status_code, json_data, resp.headers
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            json_data = json.loads(resp_body) if resp_body else {}
        except Exception:
            json_data = resp_body
        return e.code, json_data, e.headers

def run_tests():
    print("\n" + "="*80)
    print("🚀 СТАРТ ПОЛНОГО СКВОЗНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ (FULL E2E SYSTEM TEST)")
    print("="*80 + "\n")

    # 1. Регистрация Пользователя 1 (Студент 1)
    u1_data = {
        "username": f"student_user1_{int(time.time())}",
        "password": "Password123!",
        "full_name": "Иванов Иван Иванович",
        "group_number": "22-ИВТ-1"
    }
    status, res, _ = http_req("/auth/register", "POST", u1_data)
    assert status == 200, f"User 1 Register failed ({status}): {res}"
    token_u1 = res["access_token"]
    user1_id = res["user"]["id"]
    log(f"Пользователь 1 успешно зарегистрирован (ID: {user1_id}, Username: {u1_data['username']})", "OK")

    # 2. Регистрация Пользователя 2 (Студент 2)
    u2_data = {
        "username": f"student_user2_{int(time.time())}",
        "password": "Password123!",
        "full_name": "Петров Петр Петрович",
        "group_number": "22-ИВТ-2"
    }
    status, res, _ = http_req("/auth/register", "POST", u2_data)
    assert status == 200, f"User 2 Register failed ({status}): {res}"
    token_u2 = res["access_token"]
    user2_id = res["user"]["id"]
    log(f"Пользователь 2 успешно зарегистрирован (ID: {user2_id}, Username: {u2_data['username']})", "OK")

    # 3. Авторизация Главного Администратора
    status, res, _ = http_req("/auth/admin-login", "POST", {"username": ADMIN_USER, "password": ADMIN_PASS})
    assert status == 200, f"Admin login failed ({status}): {res}"
    token_admin = res["access_token"]
    log(f"Главный Администратор успешно авторизован (Role: {res['user']['role']})", "OK")

    # 4. Пользователь 1 создает вопрос на форуме
    q_payload = {
        "title": "Как найти 209 кабинет на 2 этаже?",
        "category": "Учеба",
        "content": "Подскажите пожалуйста, в каком крыле находится дирекция ИВИТШ (кабинет 209)?"
    }
    status, res, _ = http_req("/forum/questions", "POST", q_payload, token=token_u1)
    assert status == 200, f"Create Question failed ({status}): {res}"
    question_id = res["id"]
    log(f"Пользователь 1 создал вопрос (Question ID: {question_id}, Title: '{q_payload['title']}')", "OK")

    # 5. Пользователь 2 запрашивает список вопросов форума
    status, questions, _ = http_req("/forum/questions", "GET")
    assert status == 200, f"Get questions failed ({status}): {questions}"
    assert any(q["id"] == question_id for q in questions), "Созданный вопрос не найден в списке для Пользователя 2!"
    log(f"Пользователь 2 запросил список вопросов — новый вопрос отображается в общем списке", "OK")

    # 6. Пользователь 2 отправляет ответ на вопрос Пользователя 1
    ans_payload = {"content": "Кабинет Б-209 находится на 2 этаже Корпуса Б прямо по коридору!"}
    status, res, _ = http_req(f"/forum/questions/{question_id}/answers", "POST", ans_payload, token=token_u2)
    assert status == 200, f"Create Answer failed ({status}): {res}"
    answer_id = res["id"]
    log(f"Пользователь 2 ответил на вопрос Пользователя 1 (Answer ID: {answer_id})", "OK")

    # 7. Пользователь 2 и Пользователь 1 голосуют за вопрос
    status, res, _ = http_req(f"/forum/questions/{question_id}/vote", "POST", {"vote_type": 1}, token=token_u2)
    assert status == 200, f"Vote failed ({status}): {res}"
    status, res, _ = http_req(f"/forum/questions/{question_id}/vote", "POST", {"vote_type": 1}, token=token_u1)
    assert status == 200, f"Vote failed ({status}): {res}"

    # Проверка деталей вопроса после голосования
    status, q_detail, _ = http_req(f"/forum/questions/{question_id}", "GET", token=token_u1)
    assert status == 200, f"Get Question Detail failed ({status}): {q_detail}"
    assert q_detail["votes_count"] == 2, f"Expected 2 votes, got {q_detail['votes_count']}"
    log(f"Голосование проверено — счетчик голосов равен 2 (user_vote Пользователя 1 = {q_detail['user_vote']})", "OK")

    # 8. ПРОВЕРКА БЕЗОПАСНОСТИ (IDOR / BOLA): Пользователь 2 пытается удалить вопрос Пользователя 1
    status, res, _ = http_req(f"/forum/questions/{question_id}", "DELETE", token=token_u2)
    assert status == 403, f"Expected 403 Forbidden for non-owner, got {status}"
    log(f"Проверка IDOR/BOLA успешна: Пользователю 2 отказано в удалении чужого вопроса (HTTP 403 Forbidden)", "OK")

    # 9. ТЕСТ ИИ-ЧАТБОТА ВИТШИК (RAG)
    status, res, _ = http_req("/chat", "POST", {"message": "Где находится коворкинг?"})
    assert status == 200, f"Chat failed ({status}): {res}"
    reply = res["reply"]
    assert "коворкинг" in reply.lower() or "4 этаж" in reply.lower(), f"Unexpected bot reply: {reply}"
    log(f"ИИ-маскот ВИТШик успешно ответил на вопрос про коворкинг: '{reply[:60]}...'", "OK")

    # 10. ТЕСТ РАСПИСАНИЯ
    status, res, _ = http_req("/schedule/years", "GET")
    assert status == 200, f"Schedule years failed ({status}): {res}"
    log(f"Эндпоинт расписания /schedule/years вернул список учебных лет: {res['data']['years']}", "OK")

    # 11. АДМИНИСТРИРОВАНИЕ И МОДЕРАЦИЯ (Администратор удаляет вопрос)
    status, res, _ = http_req(f"/forum/questions/{question_id}", "DELETE", token=token_admin)
    assert status == 200, f"Admin delete failed ({status}): {res}"
    log(f"Администратор успешно удалил вопрос с форума (HTTP 200 OK)", "OK")

    # Проверка, что удаленного вопроса больше нет
    status, res, _ = http_req(f"/forum/questions/{question_id}", "GET")
    assert status == 404
    log(f"Проверка удаления: повторный запрос вопроса отдает HTTP 404 Not Found", "OK")

    # 12. ТЕСТ СЕРВЕРНОГО ОТЗЫВА JWT (LOGOUT & REVOCATION)
    status, res, _ = http_req("/auth/logout", "POST", token=token_u1)
    assert status == 200, f"Logout failed ({status}): {res}"

    # Запрос /auth/me с отозванным токеном Пользователя 1 должен вернуть 401 Unauthorized!
    status, res, _ = http_req("/auth/me", "GET", token=token_u1)
    assert status == 401, f"Expected 401 Unauthorized after logout, got {status}"
    log(f"Проверка отзыва JWT: токен Пользователя 1 заблокирован на сервере (HTTP 401 Unauthorized на /auth/me)", "OK")

    print("\n" + "="*80)
    print("🎉 ВСЕ ТЕСТЫ И СЦЕНАРИИ МУЛЬТИПОЛЬЗОВАТЕЛЬСКОЙ РАБОТЫ УСПЕШНО ПРОЙДЕНЫ (100% SUCCESS)!")
    print("="*80 + "\n")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        import traceback
        traceback.print_exc()
        log(f"Критическая ошибка тестирования: {e}", "FAIL")
        sys.exit(1)
