"""Shared pytest fixtures for the Knowledge Debt Engine database test suite.

Every test runs against a FRESH in-memory SQLite database (function scope),
so the suite never touches the developer's real database. DATABASE_URL is
deliberately ignored: the repository layer is rebound to the test engine
instead (see bind_repository_to_test_db).
"""

import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Make `import database...` work no matter where pytest is invoked from.
_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from database import models, repository  # noqa: E402


@pytest.fixture()
def db_engine():
    """A brand-new in-memory SQLite engine with all tables created."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # every session shares ONE in-memory database
    )
    models.Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def session_factory(db_engine):
    return sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(autouse=True)
def bind_repository_to_test_db(session_factory, monkeypatch):
    """Point the repository layer at the test engine for every test."""
    monkeypatch.setattr(repository, "session_factory", session_factory)


@pytest.fixture()
def ids():
    """A student plus two prerequisite-linked concepts (Arrays → Pointers)."""
    arrays = repository.get_or_create_concept("Arrays", "Indexing and iteration")
    pointers = repository.get_or_create_concept("Pointers", "Dereferencing and addresses")
    repository.add_prerequisite(pointers["id"], arrays["id"])
    student = repository.create_student("S001", "Test Student")
    return {
        "student_id": student["id"],
        "arrays_id": arrays["id"],
        "pointers_id": pointers["id"],
    }
