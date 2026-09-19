"""
ORM models for the Knowledge Debt Engine.

Data flow: Student → Evidence → Debt → Intervention → MentorReview → Event
(the Event table is an append-only audit log of every state transition).

The enums deliberately live here so both the state machine
(database/state_machine.py) and the Alembic migrations can import them from
one place.

Prerequisite graph example (self-referencing many-to-many):
    Programming Basics → Arrays → Pointers → Linked Lists → Trees
    (a row (Pointers, Arrays) means "master Arrays BEFORE Pointers")
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLEnum

from database.connection import Base


def utcnow() -> datetime:
    """Naive UTC 'now'.

    SQLite's DateTime does not round-trip tzinfo (aware in → naive out), so we
    standardize on naive UTC everywhere: all timestamps in this project are
    UTC, stored tz-naive for consistent comparisons and ISO serialization.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)



class DebtStatus(str, enum.Enum):
    """The full debt lifecycle, including branch/terminal states.

    CLEAR → SUSPECTED → CONFIRMED_DEBT → INTERVENTION_PROPOSED → MENTOR_REVIEW
          → IN_INTERVENTION → FOLLOW_UP → VERIFYING → REPAID
      branch: VERIFYING → FAILED → (INTERVENTION_PROPOSED | ESCALATED)
      branch: REPAID → REGRESSED → CONFIRMED_DEBT
    """

    CLEAR = "CLEAR"
    SUSPECTED = "SUSPECTED"
    CONFIRMED_DEBT = "CONFIRMED_DEBT"
    INTERVENTION_PROPOSED = "INTERVENTION_PROPOSED"
    MENTOR_REVIEW = "MENTOR_REVIEW"
    IN_INTERVENTION = "IN_INTERVENTION"
    FOLLOW_UP = "FOLLOW_UP"
    VERIFYING = "VERIFYING"
    REPAID = "REPAID"
    FAILED = "FAILED"
    ESCALATED = "ESCALATED"
    REGRESSED = "REGRESSED"


class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class EvidenceSource(str, enum.Enum):
    QUIZ = "quiz"
    CODING = "coding"
    FOLLOW_UP = "follow_up"
    LEETCODE = "leetcode"


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    external_id = Column(String(64), nullable=False, unique=True, index=True)  # e.g. "S001"
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False, unique=True, index=True)  # e.g. "Pointers"
    description = Column(String(500), nullable=True)


class Prerequisite(Base):
    """Self-referencing many-to-many dependency graph.

    A row (concept_id=X, prerequisite_concept_id=Y) means: concept X requires
    concept Y to be mastered first.
    """

    __tablename__ = "prerequisites"

    concept_id = Column(Integer, ForeignKey("concepts.id"), primary_key=True)
    prerequisite_concept_id = Column(Integer, ForeignKey("concepts.id"), primary_key=True)


class Evidence(Base):
    """One observed performance signal (quiz, coding, follow-up, LeetCode).

    A single row NEVER creates or moves a debt by itself — see
    repository.add_evidence.
    """

    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    source = Column(
        SQLEnum(
            EvidenceSource,
            native_enum=False,
            validate_strings=True,
            # store the lowercase values ("quiz", "coding", ...) in the DB
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    score = Column(Float, nullable=False)  # 0-100
    passed = Column(Boolean, nullable=False, default=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        # student+concept is the most frequent query pair (history, detection)
        Index("ix_evidence_student_concept", "student_id", "concept_id"),
    )


class Debt(Base):
    """One tracked unresolved learning gap per (student, concept) pair."""

    __tablename__ = "debts"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    status = Column(
        SQLEnum(DebtStatus, native_enum=False, name="debt_status", validate_strings=True),
        nullable=False,
        default=DebtStatus.CLEAR,
    )
    severity = Column(
        SQLEnum(Severity, native_enum=False, name="debt_severity", validate_strings=True),
        nullable=True,  # set when the debt is confirmed
    )
    attempts = Column(Integer, nullable=False, default=0)  # interventions recorded
    failed_interventions = Column(Integer, nullable=False, default=0)  # verifications failed
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        # One debt per (student, concept); REGRESSED re-opens the SAME row so
        # the whole history (attempts, interventions) stays in one place.
        UniqueConstraint("student_id", "concept_id", name="uq_debt_student_concept"),
        Index("ix_debt_student_concept", "student_id", "concept_id"),
    )


class Intervention(Base):
    """One version of a remediation plan for a debt (V1, V2, ...).

    `content` keeps the AI-generated strategy as-is; if a mentor edits it,
    the edited version lives in MentorReview.edited_content, so original and
    edit both stay part of the student's permanent history.
    """

    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True)
    debt_id = Column(Integer, ForeignKey("debts.id"), nullable=False)
    version = Column(String(8), nullable=False)  # "V1", "V2", ...
    content = Column(JSON, nullable=False)  # explanation/diagrams/questions/etc.
    mentor_status = Column(String(16), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        UniqueConstraint("debt_id", "version", name="uq_intervention_debt_version"),
        Index("ix_interventions_debt_id", "debt_id"),
    )


class MentorReview(Base):
    """A human mentor's APPROVE / EDIT / REJECT decision on an intervention."""

    __tablename__ = "mentor_reviews"

    id = Column(Integer, primary_key=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=False)
    mentor_id = Column(String(64), nullable=True)
    decision = Column(String(16), nullable=False)  # approved | edited | rejected
    edited_content = Column(JSON, nullable=True)  # present when decision == "edited"
    timestamp = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (Index("ix_mentor_reviews_intervention_id", "intervention_id"),)


class Event(Base):
    """Append-only audit log: every state transition (and other notable
    actions) lands here. Rows are never updated or deleted."""

    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    debt_id = Column(Integer, ForeignKey("debts.id"), nullable=True)
    event_type = Column(String(64), nullable=False)  # DEBT_STATUS_TRANSITION, ...
    payload = Column(JSON, nullable=False, default=dict)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        Index("ix_events_student_id", "student_id"),
        Index("ix_events_debt_id", "debt_id"),
    )

