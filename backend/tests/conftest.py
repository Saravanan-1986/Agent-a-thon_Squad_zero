import os
import pytest

# Member 3's backend test suite is written against the deterministic
# in-memory mock repository — force it explicitly so the suite stays green
# even when Member 2's durable database layer (database.compat) is installed.
os.environ.setdefault("KNOWLEDGE_DEBT_USE_MOCK", "true")
os.environ["KNOWLEDGE_DEBT_TEST_MODE"] = "true"

@pytest.fixture(autouse=True, scope="session")
def enable_test_mode():
    yield

@pytest.fixture(autouse=True)
def bind_repository_to_test_db(monkeypatch):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from database import models, repository

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    models.Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    monkeypatch.setattr(repository, "session_factory", factory)
    yield
    engine.dispose()

