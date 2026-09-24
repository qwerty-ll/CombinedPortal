import app.models as models
from conftest import CSRF, login_admin, login_student


def _ask(c):
    r = c.post("/api/v1/forum/questions", json={"title": "Где 209?", "category": "Учеба", "content": "Не могу найти дирекцию"}, headers=CSRF)
    assert r.status_code == 200
    return r.json()["id"]


def _answer(c, qid, text="На втором этаже"):
    r = c.post(f"/api/v1/forum/questions/{qid}/answers", json={"content": text}, headers=CSRF)
    assert r.status_code == 200
    return r.json()["id"]


def test_answer_delete_permissions(app, fake_eios, db):
    author = login_student(app, fake_eios, "24-isbo-001", eios_id="1")
    other = login_student(app, fake_eios, "24-isbo-002", eios_id="2")
    qid = _ask(author)
    aid = _answer(author, qid)
    assert other.delete(f"/api/v1/forum/answers/{aid}", headers=CSRF).status_code == 403
    assert author.delete(f"/api/v1/forum/answers/{aid}", headers=CSRF).status_code == 200

    spam = _answer(other, qid, "спам")
    moderator = login_admin(app)
    assert moderator.delete(f"/api/v1/forum/answers/{spam}", headers=CSRF).status_code == 200
    assert db.query(models.ForumAnswer).count() == 0


def test_only_one_solution_per_question(app, fake_eios):
    author = login_student(app, fake_eios, "24-isbo-001", eios_id="1")
    other = login_student(app, fake_eios, "24-isbo-002", eios_id="2")
    qid = _ask(author)
    a1, a2 = _answer(other, qid, "первый"), _answer(other, qid, "второй")
    assert other.post(f"/api/v1/forum/answers/{a1}/solution", headers=CSRF).status_code == 403
    assert author.post(f"/api/v1/forum/answers/{a1}/solution", headers=CSRF).json()["is_solution"] is True
    assert author.post(f"/api/v1/forum/answers/{a2}/solution", headers=CSRF).json()["is_solution"] is True
    answers = {a["id"]: a["is_solution"] for a in author.get(f"/api/v1/forum/questions/{qid}/answers").json()}
    assert answers == {a1: False, a2: True}


def test_pin_is_moderator_only(app, fake_eios):
    author = login_student(app, fake_eios)
    qid = _ask(author)
    assert author.post(f"/api/v1/forum/questions/{qid}/pin", headers=CSRF).status_code == 403
    assert login_admin(app).post(f"/api/v1/forum/questions/{qid}/pin", headers=CSRF).json()["is_pinned"] is True


def test_search_escapes_like_wildcards(app, fake_eios):
    author = login_student(app, fake_eios)
    _ask(author)
    assert author.get("/api/v1/forum/questions", params={"search": "%"}).json() == []
    assert len(author.get("/api/v1/forum/questions", params={"search": "209"}).json()) == 1
