from fastapi.testclient import TestClient

import app.models as models
from app.core import security
from app.services import eios
from conftest import CSRF, add_eios_account, login_admin, login_student


def test_admin_login_sets_httponly_cookie_and_returns_no_token(client):
    r = client.post("/api/v1/auth/admin-login", json={"username": "portal_admin", "password": "Adm1n-Test-Password!"})
    assert r.status_code == 200
    assert "access_token" not in r.json()
    cookie = r.headers["set-cookie"]
    assert "portal_token=" in cookie and "HttpOnly" in cookie and "SameSite=lax" in cookie
    assert client.get("/api/v1/auth/me").json()["role"] == "admin"


def test_admin_login_is_rate_limited(client):
    for _ in range(5):
        r = client.post("/api/v1/auth/admin-login", json={"username": "portal_admin", "password": "wrong"})
        assert r.status_code == 401
    r = client.post("/api/v1/auth/admin-login", json={"username": "portal_admin", "password": "Adm1n-Test-Password!"})
    assert r.status_code == 429


def test_eios_login_creates_student_bound_to_eios_id(app, fake_eios, db):
    c = login_student(app, fake_eios, "24-ISBO-001", eios_id="555")
    me = c.get("/api/v1/auth/me").json()
    assert me["username"] == "24-isbo-001"
    assert me["full_name"] == "Иванов Иван Иванович"
    user = db.query(models.User).filter_by(username="24-isbo-001").one()
    assert user.sdo_id == "555" and user.auth_source == "eios"


def test_eios_avatar_is_kept_for_later_page_loads(app, fake_eios):
    photo = "https://sdo.kosgos.ru/pluginfile.php/5/user/icon/f1"
    c = login_student(app, fake_eios, "24-isbo-001", avatar_url=photo)
    # /auth/me runs on every page load; it must still carry the EIOS picture
    assert c.get("/api/v1/auth/me").json()["userpictureurl"] == photo
    # A later login without a picture in the EIOS reply keeps the saved one
    c = login_student(app, fake_eios, "24-isbo-001", avatar_url=None)
    assert c.get("/api/v1/auth/me").json()["userpictureurl"] == photo


def test_eios_avatar_must_be_a_web_link(app, fake_eios):
    c = login_student(app, fake_eios, "24-isbo-001", avatar_url="javascript:alert(1)")
    assert c.get("/api/v1/auth/me").json()["userpictureurl"] is None


def test_eios_login_is_case_insensitive_for_existing_accounts(app, fake_eios, db):
    login_student(app, fake_eios, "24-isbo-001")
    login_student(app, fake_eios, "24-ISBO-001")
    assert db.query(models.User).count() == 1


def test_eios_login_rejects_wrong_password_and_rate_limits(client, fake_eios):
    add_eios_account(fake_eios, "24-isbo-002", password="right")
    for _ in range(5):
        assert client.post("/api/v1/auth/eios-login", json={"username": "24-isbo-002", "password": "bad"}).status_code == 401
    r = client.post("/api/v1/auth/eios-login", json={"username": "24-isbo-002", "password": "right"})
    assert r.status_code == 429


def test_eios_login_cannot_reach_local_admin(app, client, fake_eios):
    login_admin(app)
    accounts, calls = fake_eios
    add_eios_account(fake_eios, "portal_admin")
    r = client.post("/api/v1/auth/eios-login", json={"username": "portal_admin", "password": "pw"})
    assert r.status_code == 401
    assert calls == []


def test_eios_login_rejects_different_eios_identity(app, client, fake_eios):
    login_student(app, fake_eios, "24-isbo-003", eios_id="1")
    add_eios_account(fake_eios, "24-isbo-003", eios_id="2")
    r = client.post("/api/v1/auth/eios-login", json={"username": "24-isbo-003", "password": "pw"})
    assert r.status_code == 409


def test_eios_unavailable_returns_503(client, monkeypatch):
    async def down(username, password):
        raise eios.EiosUnavailable()
    monkeypatch.setattr(eios, "authenticate", down)
    r = client.post("/api/v1/auth/eios-login", json={"username": "x", "password": "y"})
    assert r.status_code == 503


def test_logout_revokes_token(app, fake_eios):
    c = login_student(app, fake_eios)
    token = c.cookies.get(security.AUTH_COOKIE_NAME)
    assert c.post("/api/v1/auth/logout", headers=CSRF).status_code == 200
    stolen = TestClient(app)
    stolen.cookies.set(security.AUTH_COOKIE_NAME, token)
    assert stolen.get("/api/v1/auth/me").status_code == 401


def test_cookie_writes_require_csrf_header(app, fake_eios):
    c = login_student(app, fake_eios)
    body = {"title": "Где столовая?", "category": "Учеба", "content": "Подскажите, где поесть рядом"}
    assert c.post("/api/v1/forum/questions", json=body).status_code == 403
    assert c.post("/api/v1/forum/questions", json=body, headers=CSRF).status_code == 200


def test_full_name_is_not_user_editable(app, fake_eios):
    c = login_student(app, fake_eios)
    r = c.patch("/api/v1/auth/me", json={"full_name": "Администратор ИВИТШ", "group_number": "25-ИВТбо-1"}, headers=CSRF)
    assert r.status_code == 200
    assert r.json()["full_name"] == "Иванов Иван Иванович"
    assert r.json()["group_number"] == "25-ИВТбо-1"


def test_password_hashing_rejects_legacy_sha256():
    hashed = security.get_password_hash("secret-password")
    assert security.verify_password("secret-password", hashed)
    assert not security.verify_password("wrong", hashed)
    legacy = "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b"  # sha256("secret")
    assert not security.verify_password("secret", legacy)


def test_parse_auth_response():
    ok = {"state": 1, "accessToken": "t", "data": {"user": {"userID": 7, "shortFIO": "Иванов И. И."}}}
    identity = eios.parse_auth_response(ok)
    assert identity.eios_id == "7" and identity.full_name == "Иванов И. И."
    assert eios.parse_auth_response({"state": 0, "accessToken": "t", "data": {"user": {"userID": 7}}}) is None
    assert eios.parse_auth_response({"data": {"user": {"userID": 7}}}) is None
    assert eios.parse_auth_response({"state": 1}) is None
    assert eios.parse_auth_response("error") is None
