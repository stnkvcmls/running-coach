from app.models import CoachMemory


def test_list_empty_returns_empty_list(client):
    resp = client.get("/api/v1/coach-memory")
    assert resp.status_code == 200
    assert resp.json() == []


def test_post_creates_memory(client, db):
    payload = {"category": "niggle", "tag": "knee pain", "note": "Sore after long runs."}
    resp = client.post("/api/v1/coach-memory", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] >= 1
    assert body["category"] == "niggle"
    assert body["tag"] == "knee pain"
    assert body["note"] == "Sore after long runs."
    assert body["active"] is True
    assert db.query(CoachMemory).count() == 1


def test_post_defaults_category_to_note(client):
    resp = client.post("/api/v1/coach-memory", json={"tag": "hates treadmills", "note": "Prefers outdoor runs."})
    assert resp.status_code == 200
    assert resp.json()["category"] == "note"


def test_list_returns_newest_first(client):
    client.post("/api/v1/coach-memory", json={"tag": "first", "note": "a"})
    client.post("/api/v1/coach-memory", json={"tag": "second", "note": "b"})
    resp = client.get("/api/v1/coach-memory")
    tags = [m["tag"] for m in resp.json()]
    assert tags == ["second", "first"]


def test_put_updates_fields(client):
    created = client.post("/api/v1/coach-memory", json={"tag": "knee pain", "note": "Sore."}).json()
    resp = client.put(f"/api/v1/coach-memory/{created['id']}", json={"note": "Resolved.", "active": False})
    assert resp.status_code == 200
    body = resp.json()
    assert body["tag"] == "knee pain"  # unspecified field preserved
    assert body["note"] == "Resolved."
    assert body["active"] is False


def test_put_missing_returns_404(client):
    resp = client.put("/api/v1/coach-memory/999", json={"note": "x"})
    assert resp.status_code == 404


def test_delete_removes_memory(client, db):
    created = client.post("/api/v1/coach-memory", json={"tag": "knee pain", "note": "Sore."}).json()
    resp = client.delete(f"/api/v1/coach-memory/{created['id']}")
    assert resp.status_code == 200
    assert resp.json() == {"deleted": True}
    assert db.query(CoachMemory).count() == 0


def test_delete_missing_returns_404(client):
    resp = client.delete("/api/v1/coach-memory/999")
    assert resp.status_code == 404


def test_scoped_to_current_user(client, db):
    """A memory belonging to another user is invisible to this client's user."""
    db.add(CoachMemory(user_id=999, category="niggle", tag="other user", note="n/a"))
    db.commit()
    resp = client.get("/api/v1/coach-memory")
    assert resp.json() == []
