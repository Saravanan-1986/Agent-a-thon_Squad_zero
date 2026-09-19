"""
Repository layer — the ONLY module that talks to the database.

Design notes
------------
* Every function takes an optional `session`:
    - session=None  → a short-lived session is opened, committed and closed.
    - session given → the caller owns the transaction; we only flush.
      (FastAPI should pass the `Depends(get_db)` session here.)
* Every function returns plain dicts (JSON-ready): timestamps are ISO-8601
  strings, enums are their string values (status="CONFIRMED_DEBT",
  source="quiz"). backend/schemas can map these freely — nothing here
  imports from backend/.
* Tests can rebind `repository.session_factory` to an in-memory engine
  (see tests/conftest.py) without touching DATABASE_URL.

Guards enforced here ("LLM proposes. Evidence decides."):
* update_debt_status validates every transition against the lifecycle state
  machine, so invented academic states raise InvalidStateTransitionError.
* VERIFYING → REPAID requires fresh, PASSING verification evidence
  (DebtVerificationError) — neither the student nor the LLM can claim mastery.
* REPAID → REGRESSED requires FAILING evidence for the same (student, concept).
* FAILED → INTERVENTION_PROPOSED is refused once failed_interventions >=
  RETRY_LIMIT; the orchestrator must ESCALATE instead (resolve_post_failure).
"""

from __future__ import annotations

import re
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import connection
from database.models import (
    Concept,
    Debt,
    DebtStatus,
    Event,
    Evidence,
    EvidenceSource,
    Intervention,
    MentorReview,
    Prerequisite,
    Severity,
    Student,
    utcnow,
)
from database.state_machine import (
    RETRY_LIMIT,
    DebtNotFoundError,
    DebtVerificationError,
    InvalidStateTransitionError,
    KnowledgeDebtError,
    RetryLimitExceededError,
    normalize_status,
    validate_transition,
)

#: Overridable indirection so tests can bind the repository to an in-memory
#: engine without touching DATABASE_URL. None → use the configured default.
session_factory = None

_VERSION_RE = re.compile(r"^V\d+$")
_MENTOR_DECISIONS = {"approved", "edited", "rejected"}


def _new_session() -> Session:
    """Open a session from the (possibly test-overridden) default factory."""
    if session_factory is not None:
        return session_factory()
    return connection.get_session_factory()()


@contextmanager
def _session_or(session: Optional[Session]):
    """Yield `session` as-is, or open+commit+close a short-lived one."""
    if session is not None:
        yield session  # caller owns commit/rollback
    else:
        s = _new_session()
        try:
            yield s
            s.commit()
        except Exception:
            s.rollback()
            raise
        finally:
            s.close()


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value is not None else None



# --------------------------------------------------------------------------
# dict serializers (the repository's return-shape contract)
# --------------------------------------------------------------------------

def _student_to_dict(s: Student) -> dict:
    return {
        "id": s.id,
        "external_id": s.external_id,
        "name": s.name,
        "created_at": _iso(s.created_at),
    }


def _concept_to_dict(c: Concept) -> dict:
    return {"id": c.id, "name": c.name, "description": c.description}


def _evidence_to_dict(e: Evidence) -> dict:
    return {
        "id": e.id,
        "student_id": e.student_id,
        "concept_id": e.concept_id,
        "source": e.source.value if e.source is not None else None,
        "score": e.score,
        "passed": bool(e.passed),
        "timestamp": _iso(e.timestamp),
    }


def _debt_to_dict(d: Debt, concept_name: Optional[str] = None) -> dict:
    return {
        "id": d.id,
        "student_id": d.student_id,
        "concept_id": d.concept_id,
        "concept_name": concept_name,
        "status": d.status.value if d.status is not None else None,
        "severity": d.severity.value if d.severity is not None else None,
        "attempts": d.attempts,
        "failed_interventions": d.failed_interventions,
        "created_at": _iso(d.created_at),
        "updated_at": _iso(d.updated_at),
    }


def _intervention_to_dict(i: Intervention) -> dict:
    return {
        "id": i.id,
        "debt_id": i.debt_id,
        "version": i.version,
        "content": i.content,
        "mentor_status": i.mentor_status,
        "created_at": _iso(i.created_at),
    }


def _review_to_dict(r: MentorReview) -> dict:
    return {
        "id": r.id,
        "intervention_id": r.intervention_id,
        "mentor_id": r.mentor_id,
        "decision": r.decision,
        "edited_content": r.edited_content,
        "timestamp": _iso(r.timestamp),
    }


def _event_to_dict(e: Event) -> dict:
    return {
        "id": e.id,
        "student_id": e.student_id,
        "debt_id": e.debt_id,
        "event_type": e.event_type,
        "payload": e.payload,
        "timestamp": _iso(e.timestamp),
    }



# --------------------------------------------------------------------------
# shared lookups
# --------------------------------------------------------------------------

def _require_student(s: Session, student_id: int) -> Student:
    student = s.get(Student, student_id)
    if student is None:
        raise KnowledgeDebtError(f"Student id={student_id} does not exist")
    return student


def _require_concept(s: Session, concept_id: int) -> Concept:
    concept = s.get(Concept, concept_id)
    if concept is None:
        raise KnowledgeDebtError(f"Concept id={concept_id} does not exist")
    return concept


# --------------------------------------------------------------------------
# students & concepts
# --------------------------------------------------------------------------

def create_student(external_id: str, name: str, *, session: Optional[Session] = None) -> dict:
    """Create a student; `external_id` is the natural key (e.g. "S001")."""
    with _session_or(session) as s:
        existing = s.scalar(select(Student).where(Student.external_id == external_id))
        if existing is not None:
            raise KnowledgeDebtError(
                f"Student external_id={external_id!r} already exists (id={existing.id})"
            )
        student = Student(external_id=external_id, name=name)
        s.add(student)
        s.flush()  # assigns the PK
        return _student_to_dict(student)


def get_student(
    student_id: Optional[int] = None,
    *,
    external_id: Optional[str] = None,
    session: Optional[Session] = None,
) -> Optional[dict]:
    """Fetch one student by id or by external_id; None when missing."""
    if student_id is None and external_id is None:
        raise ValueError("Provide student_id or external_id")
    with _session_or(session) as s:
        stmt = select(Student)
        if student_id is not None:
            stmt = stmt.where(Student.id == student_id)
        else:
            stmt = stmt.where(Student.external_id == external_id)
        student = s.scalar(stmt)
        return _student_to_dict(student) if student is not None else None


def get_or_create_concept(
    name: str, description: Optional[str] = None, *, session: Optional[Session] = None
) -> dict:
    """Idempotent concept lookup/creation by unique name (e.g. "Pointers")."""
    with _session_or(session) as s:
        concept = s.scalar(select(Concept).where(Concept.name == name))
        if concept is None:
            concept = Concept(name=name, description=description)
            s.add(concept)
            s.flush()
        return _concept_to_dict(concept)


def add_prerequisite(
    concept_id: int, prerequisite_concept_id: int, *, session: Optional[Session] = None
) -> dict:
    """Record that `concept_id` requires `prerequisite_concept_id` first."""
    with _session_or(session) as s:
        _require_concept(s, concept_id)
        _require_concept(s, prerequisite_concept_id)
        if concept_id == prerequisite_concept_id:
            raise ValueError("A concept cannot be its own prerequisite")
        existing = s.get(Prerequisite, (concept_id, prerequisite_concept_id))
        if existing is None:
            s.add(
                Prerequisite(concept_id=concept_id, prerequisite_concept_id=prerequisite_concept_id)
            )
            s.flush()
        return {"concept_id": concept_id, "prerequisite_concept_id": prerequisite_concept_id}


# --------------------------------------------------------------------------
# evidence — the raw material of the whole engine
# --------------------------------------------------------------------------

def add_evidence(
    student_id: int,
    concept_id: int,
    source: str,
    score: float,
    passed: bool,
    *,
    timestamp: Optional[datetime] = None,
    session: Optional[Session] = None,
) -> dict:
    """Record one performance signal.

    IMPORTANT: this deliberately does NOT create or move any debt. A single
    wrong answer may be a careless mistake; debt creation/confirmation is an
    explicit act by the evidence agent via get_or_create_debt +
    detect_and_confirm_debt.
    """
    with _session_or(session) as s:
        _require_student(s, student_id)
        _require_concept(s, concept_id)
        try:
            src = source if isinstance(source, EvidenceSource) else EvidenceSource(source)
        except ValueError:
            raise ValueError(
                f"Unknown evidence source: {source!r} "
                f"(expected one of {[e.value for e in EvidenceSource]})"
            ) from None
        score = float(score)
        if not 0.0 <= score <= 100.0:
            raise ValueError(f"score must be within 0-100 (got {score})")
        # normalize to naive UTC (SQLite drops tzinfo; keep storage consistent)
        if timestamp is not None and timestamp.tzinfo is not None:
            timestamp = timestamp.astimezone(timezone.utc).replace(tzinfo=None)

        row = Evidence(
            student_id=student_id,
            concept_id=concept_id,
            source=src,
            score=score,
            passed=bool(passed),
            timestamp=timestamp or utcnow(),
        )
        s.add(row)
        s.flush()
        log_event(
            student_id,
            "EVIDENCE_RECORDED",
            {
                "evidence_id": row.id,
                "concept_id": concept_id,
                "source": src.value,
                "score": score,
                "passed": bool(passed),
            },
            session=s,
        )
        return _evidence_to_dict(row)


def get_evidence_history(
    student_id: int, concept_id: int, *, session: Optional[Session] = None
) -> list:
    """All evidence for a (student, concept) pair, oldest first."""
    with _session_or(session) as s:
        rows = s.scalars(
            select(Evidence)
            .where(Evidence.student_id == student_id, Evidence.concept_id == concept_id)
            .order_by(Evidence.timestamp.asc(), Evidence.id.asc())
        ).all()
        return [_evidence_to_dict(r) for r in rows]



# --------------------------------------------------------------------------
# debts — the persistent ledger rows
# --------------------------------------------------------------------------

_CREATION_STATUSES = {DebtStatus.CLEAR, DebtStatus.SUSPECTED}


def get_or_create_debt(
    student_id: int,
    concept_id: int,
    *,
    initial_status=DebtStatus.CLEAR,
    session: Optional[Session] = None,
) -> dict:
    """Return the (single) debt row for a (student, concept) pair.

    A new debt may only be BORN as CLEAR (neutral) or SUSPECTED (a weak
    signal was seen); any later state must be reached through
    update_debt_status so every move is validated + audited.
    """
    with _session_or(session) as s:
        _require_student(s, student_id)
        concept = _require_concept(s, concept_id)
        initial_status = normalize_status(initial_status)
        if initial_status not in _CREATION_STATUSES:
            raise InvalidStateTransitionError(
                f"A new debt may only start as CLEAR or SUSPECTED (got "
                f"{initial_status.value}); use update_debt_status to move "
                "through the lifecycle"
            )
        debt = s.scalar(
            select(Debt).where(Debt.student_id == student_id, Debt.concept_id == concept_id)
        )
        created = False
        if debt is None:
            debt = Debt(
                student_id=student_id,
                concept_id=concept_id,
                status=initial_status,
                severity=None,
                attempts=0,
                failed_interventions=0,
            )
            s.add(debt)
            s.flush()
            created = True
        if created:
            log_event(
                debt.student_id,
                "DEBT_CREATED",
                {
                    "debt_id": debt.id,
                    "concept_id": concept.id,
                    "concept_name": concept.name,
                    "status": debt.status.value,
                },
                debt_id=debt.id,
                session=s,
            )
        return _debt_to_dict(debt, concept_name=concept.name)


def get_debt(debt_id: int, *, session: Optional[Session] = None) -> Optional[dict]:
    with _session_or(session) as s:
        debt = s.get(Debt, debt_id)
        if debt is None:
            return None
        concept = s.get(Concept, debt.concept_id)
        return _debt_to_dict(debt, concept_name=concept.name if concept else None)


def _require_passing_verification_evidence(s: Session, debt: Debt, evidence_id) -> None:
    """The REPAID gate — 'LLM proposes. Evidence decides.'

    Repayment is only legal with evidence that is
      1. explicitly attached (evidence_id given),
      2. for the SAME (student, concept) as the debt,
      3. PASSING, and
      4. FRESH — taken after the latest intervention on the debt
         (equality counts as fresh to tolerate coarse clock resolution).
    Any other case raises DebtVerificationError.
    """
    if evidence_id is None:
        raise DebtVerificationError(
            "REQUEST REJECTED: Knowledge Debt can only be repaid after valid "
            "verification evidence — no verification evidence was provided"
        )
    ev = s.get(Evidence, evidence_id)
    if ev is None:
        raise DebtVerificationError(
            f"Verification evidence id={evidence_id} does not exist"
        )
    if ev.student_id != debt.student_id or ev.concept_id != debt.concept_id:
        raise DebtVerificationError(
            f"Evidence id={evidence_id} belongs to student={ev.student_id}/"
            f"concept={ev.concept_id}, not to debt {debt.id} (student="
            f"{debt.student_id}/concept={debt.concept_id})"
        )
    if not ev.passed:
        raise DebtVerificationError(
            f"REQUEST REJECTED: evidence id={evidence_id} did not pass; a debt "
            "can only be repaid on passing verification evidence"
        )
    latest = s.scalar(
        select(Intervention)
        .where(Intervention.debt_id == debt.id)
        .order_by(Intervention.created_at.desc(), Intervention.id.desc())
    )
    if latest is not None and ev.timestamp < latest.created_at:
        raise DebtVerificationError(
            f"Evidence id={evidence_id} predates intervention {latest.version}; "
            "repayment requires FRESH verification evidence taken after the "
            "intervention"
        )


def _require_failing_evidence(s: Session, debt: Debt, evidence_id) -> None:
    """The REGRESSED gate — a repaid debt may only regress on real, fresh
    failing evidence for the same (student, concept)."""
    if evidence_id is None:
        raise DebtVerificationError(
            "REQUEST REJECTED: REGRESSED requires an attached failing evidence "
            "record for this (student, concept)"
        )
    ev = s.get(Evidence, evidence_id)
    if ev is None:
        raise DebtVerificationError(f"Evidence id={evidence_id} does not exist")
    if ev.student_id != debt.student_id or ev.concept_id != debt.concept_id:
        raise DebtVerificationError(
            f"Evidence id={evidence_id} belongs to student={ev.student_id}/"
            f"concept={ev.concept_id}, not to debt {debt.id}"
        )
    if ev.passed:
        raise DebtVerificationError(
            "REGRESSED must be triggered by failing evidence, not passing evidence"
        )



def update_debt_status(
    debt_id: int,
    new_status,
    *,
    evidence_id: Optional[int] = None,
    session: Optional[Session] = None,
) -> dict:
    """Transition a debt to `new_status`, enforcing every rule of the engine.

    Guards, in order:
      1. The debt must exist (DebtNotFoundError otherwise).
      2. current → new must be in VALID_TRANSITIONS, else
         InvalidStateTransitionError (this is the "LLM → invalid state
         transition" protection: an agent cannot invent academic states).
      3. VERIFYING → REPAID requires fresh PASSING evidence via `evidence_id`
         (DebtVerificationError) — nobody can simply claim mastery.
      4. REPAID → REGRESSED requires FAILING evidence via `evidence_id`.
      5. FAILED → INTERVENTION_PROPOSED is refused with
         RetryLimitExceededError once failed_interventions >= RETRY_LIMIT —
         the orchestrator must ESCALATE instead (resolve_post_failure).
      6. FAILED → ESCALATED is only legal at/above the retry limit.

    Side effects:
      * VERIFYING → FAILED increments failed_interventions.
      * Every successful transition appends an Event row (audit log).
    """
    with _session_or(session) as s:
        debt = s.get(Debt, debt_id)
        if debt is None:
            raise DebtNotFoundError(f"Debt id={debt_id} does not exist")
        concept = s.get(Concept, debt.concept_id)

        target = normalize_status(new_status)
        current = debt.status

        # 2) pure topology check — happens BEFORE any evidence gate so an
        #    invalid request is rejected on state grounds first.
        validate_transition(current, target)

        # 3) evidence gates
        if target is DebtStatus.REPAID:
            _require_passing_verification_evidence(s, debt, evidence_id)
        elif target is DebtStatus.REGRESSED:
            _require_failing_evidence(s, debt, evidence_id)
        # 5) + 6) retry-limit guards
        elif target is DebtStatus.INTERVENTION_PROPOSED and current is DebtStatus.FAILED:
            if debt.failed_interventions >= RETRY_LIMIT:
                raise RetryLimitExceededError(
                    f"Debt {debt_id} already failed {debt.failed_interventions} "
                    f"interventions (retry limit={RETRY_LIMIT}); it must be "
                    "ESCALATED, not retried"
                )
        elif target is DebtStatus.ESCALATED:
            if debt.failed_interventions < RETRY_LIMIT:
                raise InvalidStateTransitionError(
                    f"Debt {debt_id} has only {debt.failed_interventions} failed "
                    f"interventions; ESCALATED requires at least {RETRY_LIMIT}"
                )

        # ---- all guards passed: apply the transition ----
        debt.status = target
        if target is DebtStatus.FAILED:
            debt.failed_interventions += 1
        debt.updated_at = utcnow()

        log_event(
            debt.student_id,
            "DEBT_STATUS_TRANSITION",
            {
                "debt_id": debt.id,
                "from": current.value,
                "to": target.value,
                "evidence_id": evidence_id,
            },
            debt_id=debt.id,
            session=s,
        )
        return _debt_to_dict(debt, concept_name=concept.name if concept else None)


def update_debt_severity(
    debt_id: int, severity, *, session: Optional[Session] = None
) -> dict:
    """Set a debt's severity (LOW/MEDIUM/HIGH); audited like a transition."""
    with _session_or(session) as s:
        debt = s.get(Debt, debt_id)
        if debt is None:
            raise DebtNotFoundError(f"Debt id={debt_id} does not exist")
        if not isinstance(severity, Severity):
            try:
                severity = Severity(str(severity).upper())
            except ValueError:
                raise ValueError(
                    f"Unknown severity: {severity!r} (expected LOW/MEDIUM/HIGH)"
                ) from None
        debt.severity = severity
        debt.updated_at = utcnow()
        log_event(
            debt.student_id,
            "DEBT_SEVERITY_CHANGED",
            {"debt_id": debt.id, "severity": severity.value},
            debt_id=debt.id,
            session=s,
        )
        concept = s.get(Concept, debt.concept_id)
        return _debt_to_dict(debt, concept_name=concept.name if concept else None)



# --------------------------------------------------------------------------
# interventions & mentor reviews
# --------------------------------------------------------------------------

def record_intervention(
    debt_id: int,
    version: Optional[str],
    content: dict,
    *,
    session: Optional[Session] = None,
) -> dict:
    """Store one remediation-plan version for a debt and bump `attempts`.

    `version` follows the V1/V2/... scheme. When None, the next version is
    auto-computed from the debt's existing history, so the FAIL → NEW
    STRATEGY loop stays monotonic. Versions are unique per debt.
    """
    with _session_or(session) as s:
        debt = s.get(Debt, debt_id)
        if debt is None:
            raise DebtNotFoundError(f"Debt id={debt_id} does not exist")
        if version is None:
            count = (
                s.scalar(
                    select(func.count())
                    .select_from(Intervention)
                    .where(Intervention.debt_id == debt_id)
                )
                or 0
            )
            version = f"V{count + 1}"
        if not _VERSION_RE.match(version):
            raise ValueError(
                f"Intervention version must look like 'V1', 'V2', ... (got {version!r})"
            )
        intervention = Intervention(debt_id=debt_id, version=version, content=content)
        s.add(intervention)
        debt.attempts += 1
        debt.updated_at = utcnow()
        s.flush()
        log_event(
            debt.student_id,
            "INTERVENTION_RECORDED",
            {
                "debt_id": debt_id,
                "intervention_id": intervention.id,
                "version": version,
                "attempt": debt.attempts,
            },
            debt_id=debt_id,
            session=s,
        )
        return _intervention_to_dict(intervention)


def record_mentor_review(
    intervention_id: int,
    decision: str,
    edited_content: Optional[dict] = None,
    *,
    mentor_id: Optional[str] = None,
    session: Optional[Session] = None,
) -> dict:
    """Persist a mentor's APPROVE / EDIT / REJECT decision.

    The decision becomes part of the student's permanent history (review row
    + audit event) and is mirrored onto intervention.mentor_status. This
    does NOT move the debt's state — the orchestrator performs
    MENTOR_REVIEW → IN_INTERVENTION explicitly.
    """
    with _session_or(session) as s:
        intervention = s.get(Intervention, intervention_id)
        if intervention is None:
            raise KnowledgeDebtError(f"Intervention id={intervention_id} does not exist")
        if decision not in _MENTOR_DECISIONS:
            raise ValueError(
                f"decision must be one of {sorted(_MENTOR_DECISIONS)} (got {decision!r})"
            )
        review = MentorReview(
            intervention_id=intervention_id,
            mentor_id=mentor_id,
            decision=decision,
            edited_content=edited_content,
        )
        s.add(review)
        intervention.mentor_status = decision
        s.flush()
        debt = s.get(Debt, intervention.debt_id)
        log_event(
            debt.student_id,
            "MENTOR_REVIEW_RECORDED",
            {
                "intervention_id": intervention_id,
                "decision": decision,
                "mentor_id": mentor_id,
                "has_edits": edited_content is not None,
            },
            debt_id=intervention.debt_id,
            session=s,
        )
        return _review_to_dict(review)


# --------------------------------------------------------------------------
# audit log (append-only)
# --------------------------------------------------------------------------

def log_event(
    student_id: int,
    event_type: str,
    payload: Optional[dict],
    *,
    debt_id: Optional[int] = None,
    session: Optional[Session] = None,
) -> dict:
    """Append one audit event. Events are never updated or deleted."""
    with _session_or(session) as s:
        event = Event(
            student_id=student_id,
            debt_id=debt_id,
            event_type=event_type,
            payload=payload or {},
        )
        s.add(event)
        s.flush()
        return _event_to_dict(event)



# --------------------------------------------------------------------------
# read-side views (for the UI / API layer)
# --------------------------------------------------------------------------

def get_debt_ledger(student_id: int, *, session: Optional[Session] = None) -> list:
    """All debts for a student with their live status — the "Knowledge Debt
    Ledger" view (e.g. Pointers=CONFIRMED_DEBT, Arrays=REPAID, ...)."""
    with _session_or(session) as s:
        rows = s.execute(
            select(Debt, Concept.name)
            .join(Concept, Concept.id == Debt.concept_id)
            .where(Debt.student_id == student_id)
            .order_by(Concept.name.asc())
        ).all()
        return [_debt_to_dict(debt, concept_name=name) for debt, name in rows]


def get_interventions(debt_id: int, *, session: Optional[Session] = None) -> list:
    """Full intervention version history for a debt (V1, V2, ...), oldest first."""
    with _session_or(session) as s:
        rows = s.scalars(
            select(Intervention)
            .where(Intervention.debt_id == debt_id)
            .order_by(Intervention.created_at.asc(), Intervention.id.asc())
        ).all()
        return [_intervention_to_dict(r) for r in rows]


def get_mentor_reviews(intervention_id: int, *, session: Optional[Session] = None) -> list:
    with _session_or(session) as s:
        rows = s.scalars(
            select(MentorReview)
            .where(MentorReview.intervention_id == intervention_id)
            .order_by(MentorReview.timestamp.asc(), MentorReview.id.asc())
        ).all()
        return [_review_to_dict(r) for r in rows]


def get_events(
    student_id: int,
    *,
    debt_id: Optional[int] = None,
    event_type: Optional[str] = None,
    session: Optional[Session] = None,
) -> list:
    """The student's append-only audit trail, oldest first."""
    with _session_or(session) as s:
        stmt = select(Event).where(Event.student_id == student_id)
        if debt_id is not None:
            stmt = stmt.where(Event.debt_id == debt_id)
        if event_type is not None:
            stmt = stmt.where(Event.event_type == event_type)
        rows = s.scalars(stmt.order_by(Event.timestamp.asc(), Event.id.asc())).all()
        return [_event_to_dict(r) for r in rows]


# --------------------------------------------------------------------------
# detection & orchestration helpers
# --------------------------------------------------------------------------

def detect_and_confirm_debt(
    student_id: int,
    concept_id: int,
    *,
    min_evidence: int = 2,
    weak_below: float = 60.0,
    high_below: float = 45.0,
    session: Optional[Session] = None,
) -> Optional[dict]:
    """STUB of the Evidence Agent's threshold logic (the real, LLM-assisted
    version lives in backend/agents/evidence_agent.py — Member 3's scope).

    Kept deterministic at the repository boundary so the persistence layer and
    the test suite have something concrete to run against:

      * fewer than `min_evidence` records for the (student, concept) → None
        (a single wrong answer is NOT knowledge debt);
      * average score >= `weak_below` → None (not actually weak);
      * otherwise: create/reuse the debt, drive CLEAR → SUSPECTED →
        CONFIRMED_DEBT (or REGRESSED → CONFIRMED_DEBT on a re-entry), and set
        severity HIGH when avg < `high_below`, else MEDIUM.

    Returns the confirmed debt dict, or None when nothing was confirmed.
    Idempotent: re-running on an already-confirmed debt changes nothing.
    """
    with _session_or(session) as s:
        history = get_evidence_history(student_id, concept_id, session=s)
        if len(history) < min_evidence:
            return None
        avg = sum(h["score"] for h in history) / len(history)
        if avg >= weak_below:
            return None

        debt = get_or_create_debt(student_id, concept_id, session=s)
        status = debt["status"]
        if status == DebtStatus.CLEAR.value:
            debt = update_debt_status(debt["id"], DebtStatus.SUSPECTED, session=s)
            status = debt["status"]
        if status in (DebtStatus.SUSPECTED.value, DebtStatus.REGRESSED.value):
            debt = update_debt_status(debt["id"], DebtStatus.CONFIRMED_DEBT, session=s)
            status = debt["status"]
        if status == DebtStatus.CONFIRMED_DEBT.value:
            severity = Severity.HIGH if avg < high_below else Severity.MEDIUM
            debt = update_debt_severity(debt["id"], severity, session=s)
        return debt


def resolve_post_failure(debt_id: int, *, session: Optional[Session] = None) -> dict:
    """Decide what happens after a verification FAILED — the orchestrator's
    auto-transition hook (this is what the retry-limit test exercises):

      * failed_interventions >= RETRY_LIMIT → ESCALATED
      * otherwise                            → INTERVENTION_PROPOSED
        (a NEW strategy must be built; never repeat the failed one)
    """
    with _session_or(session) as s:
        debt = s.get(Debt, debt_id)
        if debt is None:
            raise DebtNotFoundError(f"Debt id={debt_id} does not exist")
        if debt.status is not DebtStatus.FAILED:
            raise InvalidStateTransitionError(
                f"resolve_post_failure expects a FAILED debt (got {debt.status.value})"
            )
        target = (
            DebtStatus.ESCALATED
            if debt.failed_interventions >= RETRY_LIMIT
            else DebtStatus.INTERVENTION_PROPOSED
        )
        return update_debt_status(debt_id, target, session=s)






