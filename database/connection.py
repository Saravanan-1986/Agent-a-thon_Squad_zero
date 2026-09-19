"""
Database engine + session management for the Knowledge Debt Engine.

Self-contained by design: imports nothing from backend/, so it can be wired
into (or tested without) the FastAPI app.

Supported backends
------------------
* SQLite (default, zero-config):  sqlite:///./knowledge_debt.db
* Postgres (via env var):         DATABASE_URL=postgresql://user:pass@host:5432/kde
  (legacy postgres:// URLs are rewritten to postgresql:// automatically)

Snippet to hand Member 3 for backend/main.py wiring:

    from fastapi import Depends
    from sqlalchemy.orm import Session
    from database.connection import get_db
    from database import repository

    @app.get("/students/{student_id}")
    def read_student(student_id: int, db: Session = Depends(get_db)):
        return repository.get_student(student_id, session=db)
"""

from __future__ import annotations

import os
from typing import Iterator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

#: Fallback used when DATABASE_URL is not set — a local SQLite file.
DEFAULT_DATABASE_URL = "sqlite:///./knowledge_debt.db"

#: Shared declarative base; models in database.models attach to this.
Base = declarative_base()

_engine_cache: dict = {}


def get_database_url() -> str:
    """DATABASE_URL env var wins; fall back to the local SQLite file."""
    url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL).strip()
    if url.startswith("postgres://"):  # legacy Heroku-style scheme
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def get_engine(url: Optional[str] = None) -> Engine:
    """Engine for `url` (or the configured URL); cached per URL.

    SQLite notes:
      * check_same_thread=False → the connection may be used across threads
        (FastAPI runs sync endpoints in a worker threadpool).
      * In-memory SQLite uses StaticPool so every session shares the SAME
        in-memory database instead of getting its own empty one.
    """
    url = url or get_database_url()
    if url in _engine_cache:
        return _engine_cache[url]

    kwargs: dict = {}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if url in ("sqlite://", "sqlite:///:memory:", "sqlite::memory:"):
            from sqlalchemy.pool import StaticPool

            kwargs["poolclass"] = StaticPool
    engine = create_engine(url, **kwargs)
    _engine_cache[url] = engine
    return engine


def get_session_factory(engine: Optional[Engine] = None) -> sessionmaker:
    """Session factory bound to `engine` (or the configured default engine)."""
    return sessionmaker(
        bind=engine if engine is not None else get_engine(),
        autoflush=False,
        # Objects stay readable after commit; the repository maps to dicts anyway.
        expire_on_commit=False,
    )


def get_db() -> Iterator[Session]:
    """FastAPI-style dependency: yields a session and always closes it."""
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()


def init_db(engine: Optional[Engine] = None) -> None:
    """Create all tables (quick-start/dev convenience).

    Prefer Alembic for real environments:
        alembic -c database/alembic.ini upgrade head
    """
    # Imported here (not at module top) so models.py can import Base from this
    # module without a circular import.
    from database import models  # noqa: F401  (registers tables on Base.metadata)

    models.Base.metadata.create_all(engine or get_engine())
