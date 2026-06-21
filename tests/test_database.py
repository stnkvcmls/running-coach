from sqlalchemy import inspect, text

from app import database


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
        count = conn.execute(text("SELECT COUNT(*) FROM metric_zones")).scalar()
    assert count and count > 0


def test_seed_metric_zones_is_idempotent():
    database.init_db()
    with database.engine.connect() as conn:
        first = conn.execute(text("SELECT COUNT(*) FROM metric_zones")).scalar()
    # Running again must not duplicate rows.
    database._seed_metric_zones()
    with database.engine.connect() as conn:
        second = conn.execute(text("SELECT COUNT(*) FROM metric_zones")).scalar()
    assert first == second


def test_init_db_creates_all_tables():
    database.init_db()
    table_names = inspect(database.engine).get_table_names()
    expected = {
        "activities",
        "daily_summaries",
        "insights",
        "races",
        "garmin_calendar_events",
        "metric_zones",
        "sync_status",
        "athlete_profiles",
        "zone_configs",
        "training_plans",
        "training_plan_days",
        "users",
    }
    assert expected.issubset(set(table_names))


def test_init_db_is_idempotent():
    # Running init_db twice must not raise (Alembic upgrade head is a no-op at head).
    database.init_db()
    database.init_db()


def test_alembic_version_table_exists():
    database.init_db()
    table_names = inspect(database.engine).get_table_names()
    assert "alembic_version" in table_names
