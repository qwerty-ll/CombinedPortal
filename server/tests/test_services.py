import pytest

from app.routers import schedule
from app.services import eios, rag_service
from conftest import login_student


def test_schedule_returns_503_instead_of_fake_lessons(client, monkeypatch):
    async def down(endpoint, params, timeout=5.0):
        return None
    monkeypatch.setattr(eios, "fetch_json", down)
    r = client.get("/api/v1/schedule/rasp", params={"idGroup": 8540})
    assert r.status_code == 503


def test_schedule_serves_cached_answer_when_eios_goes_down(client, monkeypatch):
    real = {"data": {"rasp": [{"дисциплина": "лек Алгоритмы"}]}, "state": 1}
    responses = [real, None]

    async def flaky(endpoint, params, timeout=5.0):
        return responses.pop(0)
    monkeypatch.setattr(eios, "fetch_json", flaky)
    monkeypatch.setattr(schedule, "_RASP_TTL", 0)
    assert client.get("/api/v1/schedule/rasp", params={"idGroup": 1}).json() == real
    stale = client.get("/api/v1/schedule/rasp", params={"idGroup": 1}).json()
    assert stale["stale"] is True and stale["data"] == real["data"]


def test_schedule_accepts_empty_week(client, monkeypatch):
    async def empty(endpoint, params, timeout=5.0):
        return {"data": {"rasp": []}, "state": 1}
    monkeypatch.setattr(eios, "fetch_json", empty)
    assert client.get("/api/v1/schedule/rasp", params={"idGroup": 1}).status_code == 200


def test_anonymous_chat_never_calls_gigachat(client, monkeypatch):
    async def forbidden(*args, **kwargs):
        raise AssertionError("GigaChat must not be called for anonymous users")
    monkeypatch.setattr(rag_service, "get_access_token", forbidden)
    monkeypatch.setattr(rag_service.settings, "GIGACHAT_AUTH_KEY", "configured")
    r = client.post("/api/v1/chat", json={"message": "Какая стипендия за отличную сессию?"})
    assert r.status_code == 200 and "4500" in r.json()["reply"]


def test_chat_is_rate_limited(client):
    for _ in range(20):
        assert client.post("/api/v1/chat", json={"message": "стипендия"}).status_code == 200
    assert client.post("/api/v1/chat", json={"message": "стипендия"}).status_code == 429


class _FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.status_code)


class _FakeGigaChat:
    """Answers the OAuth endpoint with a new token each time; the chat endpoint rejects the first token."""
    issued = 0
    chat_tokens = []

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, headers=None, data=None, json=None):
        if url == rag_service.OAUTH_URL:
            _FakeGigaChat.issued += 1
            return _FakeResponse(200, {"access_token": f"token-{_FakeGigaChat.issued}", "expires_at": 4102444800000})
        token = headers["Authorization"].split()[1]
        _FakeGigaChat.chat_tokens.append(token)
        if token == "token-1":
            return _FakeResponse(401, {})
        return _FakeResponse(200, {"choices": [{"message": {"content": "Дирекция в Б-209"}}]})


@pytest.mark.anyio
async def test_gigachat_refreshes_rejected_token(monkeypatch):
    monkeypatch.setattr(rag_service.httpx, "AsyncClient", _FakeGigaChat)
    monkeypatch.setattr(rag_service.settings, "GIGACHAT_AUTH_KEY", "configured")
    rag_service._token_cache.update(access_token="", expires_at=0.0)
    reply = await rag_service.ask_gigachat("system", [], "Где дирекция?")
    assert reply == "Дирекция в Б-209"
    assert _FakeGigaChat.chat_tokens == ["token-1", "token-2"]
    rag_service._token_cache.update(access_token="", expires_at=0.0)


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_logged_in_chat_does_not_duplicate_current_message(app, fake_eios, monkeypatch):
    sent = {}

    async def capture(message, history, user, db, group_hint=None, use_llm=True):
        sent["history"] = history
        return "ok", [], None
    monkeypatch.setattr("app.routers.chat.assistant.answer", capture)
    c = login_student(app, fake_eios)
    c.post("/api/v1/chat", json={"message": "где 209", "history": [{"role": "user", "content": "привет"}]}, headers={"X-Requested-With": "XMLHttpRequest"})
    assert sent["history"] == [{"role": "user", "content": "привет"}]
