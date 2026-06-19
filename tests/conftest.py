import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401 - ensure models register on Base.metadata
from app.api import api_router
from app.database import Base, get_db


@pytest.fixture
def session_factory():
    """In-memory SQLite shared across sessions via a single connection."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine)
    engine.dispose()


@pytest.fixture
def db(session_factory):
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(session_factory):
    app = FastAPI()
    app.include_router(api_router)

    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture
def patch_db_session(session_factory, monkeypatch):
    """Return a helper that points a module's ``db_session`` at the test DB.

    Background-job code uses the ``db_session()`` context manager (bound to the
    real engine) rather than FastAPI's injected session. Tests call this to
    redirect that context manager onto the in-memory test database.
    """
    from contextlib import contextmanager

    @contextmanager
    def _fake_db_session():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    def _apply(module):
        monkeypatch.setattr(module, "db_session", _fake_db_session)

    return _apply
