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


class QuestionTypeEnum(str, enum.Enum):
    MCQ = "MCQ"
    MULTI_SELECT = "MULTI_SELECT"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"
    SCENARIO = "SCENARIO"
    CONCEPTUAL = "CONCEPTUAL"
    CODING = "CODING"
    TRACE = "TRACE"
    COMPLEXITY = "COMPLEXITY"
    CODE_READING = "CODE_READING"


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    external_id = Column(String(64), nullable=False, unique=True, index=True)  # e.g. "S001"
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Subject(Base):
    """An educational subject domain (e.g., DBMS, Data Structures, Operating Systems)."""

    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True)
    code = Column(String(32), nullable=False, unique=True, index=True)  # e.g. "DBMS"
    title = Column(String(120), nullable=False)  # e.g. "Database Management Systems"
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    code = Column(String(64), nullable=True, unique=True, index=True)  # e.g. "DBMS-NORM-3NF"
    name = Column(String(120), nullable=False, unique=True, index=True)  # e.g. "Pointers"
    category = Column(String(64), nullable=True, index=True)  # e.g. "Normalization"
    description = Column(String(500), nullable=True)
    difficulty_baseline = Column(Float, nullable=True, default=0.5)


class Prerequisite(Base):
    """Self-referencing many-to-many dependency graph.

    A row (concept_id=X, prerequisite_concept_id=Y) means: concept X requires
    concept Y to be mastered first.
    """

    __tablename__ = "prerequisites"

    concept_id = Column(Integer, ForeignKey("concepts.id"), primary_key=True)
    prerequisite_concept_id = Column(Integer, ForeignKey("concepts.id"), primary_key=True)
    relationship_type = Column(String(32), nullable=False, default="requires")  # requires | recommended
    strength = Column(Float, nullable=False, default=1.0)  # 0.0 to 1.0 dependency weight
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Question(Base):
    """Item-bank question with rich pedagogical metadata."""

    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    question_code = Column(String(64), nullable=False, unique=True, index=True)  # e.g. "Q-DBMS-NORM-001"
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    difficulty_label = Column(String(16), nullable=False)  # easy | medium | hard
    difficulty_score = Column(Float, nullable=False)  # 0.0 to 1.0 (e.g. 0.25, 0.55, 0.80)
    question_type = Column(
        SQLEnum(
            QuestionTypeEnum,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    question_text = Column(String(2000), nullable=False)
    options = Column(JSON, nullable=True)  # choices array/object for MCQ/MULTI_SELECT
    correct_answer = Column(JSON, nullable=False)  # correct answer representation
    explanation = Column(String(2000), nullable=False)  # detailed solution/explanation
    skill_tags = Column(JSON, nullable=True, default=list)  # list of skill strings
    estimated_time_seconds = Column(Integer, nullable=False, default=60)
    source_reference = Column(String(256), nullable=True)  # textbook/academic citation
    version = Column(Integer, nullable=False, default=1)
    status = Column(String(16), nullable=False, default="active")  # active | deprecated
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, onupdate=utcnow)

    __table_args__ = (
        Index("ix_questions_concept_difficulty", "concept_id", "difficulty_score"),
    )


class Assessment(Base):
    """Diagnostic or practice assessment blueprint."""

    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String(120), nullable=False)  # e.g. "DBMS Diagnostic Assessment"
    type = Column(String(32), nullable=False, default="diagnostic")  # diagnostic | practice | verification
    description = Column(String(500), nullable=True)
    total_questions = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class AssessmentQuestion(Base):
    """Junction mapping questions into an assessment sequence."""

    __tablename__ = "assessment_questions"

    assessment_id = Column(Integer, ForeignKey("assessments.id"), primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    sequence_order = Column(Integer, nullable=False, default=1)


class AssessmentAttempt(Base):
    """A student's attempt taking an assessment."""

    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    status = Column(String(16), nullable=False, default="in_progress")  # in_progress | completed | abandoned
    total_score = Column(Float, nullable=True)  # overall percentage 0-100
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_assessment_attempts_student", "student_id"),
    )


class StudentResponse(Base):
    """Granular response-level record for fine-grained ML feature extraction."""

    __tablename__ = "student_responses"

    id = Column(Integer, primary_key=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    selected_answer = Column(JSON, nullable=True)
    is_correct = Column(Boolean, nullable=False, default=False)
    score = Column(Float, nullable=False)  # 0.0 to 100.0
    response_time_seconds = Column(Float, nullable=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    question_difficulty = Column(Float, nullable=True)
    question_type = Column(String(32), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_student_responses_student_concept", "student_id", "concept_id"),
    )


class Evidence(Base):
    """One observed performance signal (quiz, coding, follow-up, LeetCode).

    A single row NEVER creates or moves a debt by itself — see
    repository.add_evidence.
    """

    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id"), nullable=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    source = Column(
        SQLEnum(
            EvidenceSource,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    score = Column(Float, nullable=False)  # 0-100
    passed = Column(Boolean, nullable=False, default=False)
    response_time_seconds = Column(Float, nullable=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    question_difficulty = Column(Float, nullable=True)
    question_type = Column(String(32), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
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
    confidence = Column(Float, nullable=False, default=0.5)  # estimated debt probability
    attempts = Column(Integer, nullable=False, default=0)  # interventions recorded
    failed_interventions = Column(Integer, nullable=False, default=0)  # verifications failed
    verification_attempt_count = Column(Integer, nullable=False, default=0)
    regression_count = Column(Integer, nullable=False, default=0)
    first_detected_at = Column(DateTime(timezone=True), nullable=True)
    last_evidence_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, onupdate=utcnow)

    __table_args__ = (
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
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

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
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)

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
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_events_student_id", "student_id"),
        Index("ix_events_debt_id", "debt_id"),
    )


