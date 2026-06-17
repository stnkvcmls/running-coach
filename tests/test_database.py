from app import database
from app.models import MetricZone


def test_get_db_yields_and_closes(monkeypatch):
    closed = {"v": False}

    class FakeSession:
        def close(self):
            closed["v"] = True

    monkeypatch.setattr(database, "SessionLocal", lambda: FakeSession())

    gen = database.get_db()
    session = next(gen)
    assert isinstance(session, FakeSession)
    # Exhausting the generator triggers the finally/close.
    try:
        next(gen)
    except StopIteration:
        pass
    assert closed["v"] is True


def test_db_session_context_manager_closes(monkeypatch):
    closed = {"v": False}

    class FakeSession:
        def close(self):
            closed["v"] = True

    monkeypatch.setattr(database, "SessionLocal", lambda: FakeSession())

    with database.db_session() as session:
        assert isinstance(session, FakeSession)
    assert closed["v"] is True


def test_init_db_seeds_metric_zones():
    # Operates on the real module engine (a local SQLite file in CI).
    database.init_db()
    with database.engine.connect() as conn:
        from sqlalchemy import text
        count = conn.execute(text("SELECT COUNT(*) FROM metric_zones")).scalar()
    assert count and count > 0


def test_seed_metric_zones_is_idempotent():
    database.init_db()
    with database.engine.connect() as conn:
        from sqlalchemy import text
        first = conn.execute(text("SELECT COUNT(*) FROM metric_zones")).scalar()
    # Running again must not duplicate rows.
    database._seed_metric_zones()
    with database.engine.connect() as conn:
        from sqlalchemy import text
        second = conn.execute(text("SELECT COUNT(*) FROM metric_zones")).scalar()
    assert first == second


def test_migrate_db_is_safe_to_rerun():
    # Adding already-present columns must not raise.
    database.init_db()
    database._migrate_db()
