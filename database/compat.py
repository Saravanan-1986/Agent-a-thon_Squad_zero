"""
Compatibility adapter: Member 3's backend/agents + backend/api <-> Member 2's
database.repository.

The backend was written against `backend/services/mock_repository.py`
(in-memory dicts, data lost on restart). This module exposes the SAME
interface on top of the real SQLAlchemy persistence layer, so the backend
automatically upgrades to durable storage once `database/` is importable:

    from database.compat import add_evidence, ...   # instead of database.repository

Interface differences handled here (mock -> real):
  * create_student(name, email)          -> external_id = email (returned as email)
  * debt["interventions"] embedded list  -> joined from the interventions table
  * intervention version as int (1,2,..) -> stored as "V1","V2",.. (read back as int)
  * severity as float (DebtOut)          -> mapped from LOW/MEDIUM/HIGH (+ severity_label)
  * root_cause_concept_id                -> defaulted to the debt's concept
  * mentor_status "PENDING" uppercase    -> mapped from pending/approved/...
  * NEW_INTERVENTION state               -> canonical INTERVENTION_PROPOSED
  * get_debt_by_id / get_events_for_debt /
    get_prerequisites / get_pending_interventions -> new thin wrappers

State-transition policy in update_debt_status:
  * ordinary targets may be reached through a BFS shortest path of legal
    edges (so a call like INTERVENTION_PROPOSED -> IN_INTERVENTION walks
    through MENTOR_REVIEW, and IN_INTERVENTION -> VERIFYING walks through
    FOLLOW_UP) — every hop is validated + audited by the real repository;
  * the GATED targets REPAID / REGRESSED / ESCALATED are direct-edge ONLY
    (no multi-hop shortcuts), and their evidence gates are enforced by the
    repository: REPAID needs fresh passing evidence (evidence_id), REGRESSED
    needs failing evidence, ESCALATED needs the retry limit reached.
"""

from __future__ import annotations

import os
from collections import deque
from typing import Any, Dict, List, Optional

from database import repository as repo
from database.models import DebtStatus, EvidenceSource, Prerequisite
from database.state_machine import (
    VALID_TRANSITIONS,
    KnowledgeDebtError,
    normalize_status,
)
from database.repository import _new_session

# Raise the SAME exception class the backend's orchestrator catches.
try:  # pragma: no cover - depends on backend presence
    from backend.state.state_machine import (
        InvalidStateTransitionError as _BridgeError,
    )
except ImportError:  # standalone database usage
    from database.state_machine import (
        InvalidStateTransitionError as _BridgeError,
    )

#: Statuses that must NEVER be reached through a multi-hop walk.
_GATED = {DebtStatus.REPAID, DebtStatus.REGRESSED, DebtStatus.ESCALATED}

#: Alias used by Member 3's backend for a fresh intervention round.
_STATE_ALIASES = {"NEW_INTERVENTION": DebtStatus.INTERVENTION_PROPOSED}

_SEVERITY_NUMERIC = {"LOW": 35.0, "MEDIUM": 60.0, "HIGH": 90.0}

_MENTOR_DECISION_MAP = {"approve": "approved", "edit": "edited", "reject": "rejected"}

_SOURCE_MAP = {
    "coding_lab": "coding",
    "lab": "coding",
    "exam": "quiz",
    "test": "quiz",
    "assignment": "coding",
    "practice": "quiz",
}

__all__ = [
    "create_student",
    "get_student",
    "list_students",
    "add_evidence",
    "get_evidence_history",
    "get_or_create_debt",
    "get_debt_by_id",
    "update_debt_status",
    "record_intervention",
    "record_mentor_review",
    "log_event",
    "get_debt_ledger",
    "get_prerequisites",
    "get_events_for_debt",
    "get_pending_interventions",
    "record_verification_evidence",
]


# --------------------------------------------------------------------------
# debts with the mock's embedded shape
# --------------------------------------------------------------------------

def _mock_intervention_dict(iv: Dict[str, Any]) -> Dict[str, Any]:
    """Intervention dict in the shape the backend expects (int version,
    PENDING-style mentor status)."""
    version = iv["version"]
    try:
        version_num = int(str(version).lstrip("Vv"))
    except ValueError:
        version_num = 0
    return {
        "id": iv["id"],
        "debt_id": iv["debt_id"],
        "version": version_num,
        "version_label": version,
        "content": iv["content"],
        "mentor_status": (iv["mentor_status"] or "pending").upper(),
        "created_at": iv["created_at"],
    }


def _debt_with_interventions(debt: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Augment a repository debt dict with the mock's embedded fields."""
    if debt is None:
        return None
    debt = dict(debt)
    debt["interventions"] = [_mock_intervention_dict(i) for i in repo.get_interventions(debt["id"])]
    # DebtOut schema expects a numeric severity; keep the label alongside
    label = debt.get("severity")
    debt["severity_label"] = label
    debt["severity"] = _SEVERITY_NUMERIC.get(label, 0.0)
    # backend reads root_cause_concept_id; default to the concept itself
    debt.setdefault("root_cause_concept_id", debt.get("concept_id"))

    # Populate concept name and code
    concept_id = debt.get("concept_id")
    if concept_id:
        c = repo.get_concept(concept_id)
        if c:
            debt["concept"] = c.get("name", "")
            debt["concept_name"] = c.get("name", "")
            debt["concept_code"] = c.get("code", "")
    if "concept" not in debt or not debt["concept"]:
        debt["concept"] = f"Concept {concept_id}"

    # Populate root cause name
    rc_id = debt.get("root_cause_concept_id")
    if rc_id:
        rc = repo.get_concept(rc_id)
        if rc:
            debt["root_cause"] = rc.get("name", "")

    # Populate evidence signals
    student_id = debt.get("student_id")
    if student_id and concept_id:
        try:
            from database.models import Evidence
            session = _new_session()
            try:
                ev_rows = session.query(Evidence).filter(
                    Evidence.student_id == student_id,
                    Evidence.concept_id == concept_id
                ).order_by(Evidence.timestamp.desc()).all()
                debt["evidence"] = [{
                    "id": f"ev-{e.id}",
                    "source": e.source or "Quiz Assessment",
                    "score": f"{int(e.score)}%" if e.score is not None else "0%",
                    "passed": bool(e.passed),
                    "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M") if e.timestamp else "",
                    "detail": f"Assessment signal recorded for {debt.get('concept', '')}."
                } for e in ev_rows]
            finally:
                session.close()
        except Exception:
            debt["evidence"] = []

    return debt


def _ensure_student(student_id: int) -> None:
    """Create a placeholder student row when the caller references an
    unknown id (mirrors the mock's permissive behaviour so the API works
    even before the seed script has run)."""
    if repo.get_student(student_id) is None:
        try:
            repo.create_student(external_id=f"student-{student_id}", name=f"Student {student_id}")
        except KnowledgeDebtError:
            pass  # lost a race — fine


def _ensure_concept(concept_id: int) -> None:
    from database import repository as _r
    from database.models import Concept

    session = _new_session()
    try:
        exists = session.get(Concept, concept_id)
    finally:
        session.close()
    if exists is None:
        _r.get_or_create_concept(f"Concept {concept_id}", None)
        # get_or_create_concept matched by name; if that made a NEW row with a
        # different id, remap by renaming is overkill — instead insert the row
        # directly so the requested id exists.
        session = _new_session()
        try:
            if session.get(Concept, concept_id) is None:
                from database.models import utcnow

                session.add(Concept(id=concept_id, name=f"Concept {concept_id}"))
                session.commit()
        finally:
            session.close()


# --------------------------------------------------------------------------
# student / evidence / concepts
# --------------------------------------------------------------------------

def create_student(name: str, email: str) -> Dict[str, Any]:
    """Mock signature create_student(name, email); email is the external_id."""
    student = repo.create_student(external_id=email, name=name)
    student = dict(student)
    student["email"] = email
    return student


def get_student(student_id: int) -> Optional[Dict[str, Any]]:
    student = repo.get_student(student_id)
    if student is None:
        return None
    student = dict(student)
    student["email"] = student["external_id"]
    return student


def list_students() -> List[Dict[str, Any]]:
    rows = repo.list_students()
    result = []
    for r in rows:
        d = dict(r)
        d["email"] = d.get("external_id")
        result.append(d)
    return result


def _map_source(source: str) -> str:
    source = (source or "quiz").strip().lower()
    return _SOURCE_MAP.get(source, source)


def add_evidence(
    student_id: int,
    concept_id: int,
    source: str = "quiz",
    score: float = 0.0,
    passed: bool = False,
    **kwargs,
) -> Dict[str, Any]:
    """Record evidence; tolerant of the backend's source vocabulary."""
    _ensure_student(student_id)
    _ensure_concept(concept_id)
    return repo.add_evidence(
        student_id, concept_id, _map_source(source), float(score), bool(passed)
    )


def get_evidence_history(student_id: int, concept_id: int) -> List[Dict[str, Any]]:
    return repo.get_evidence_history(student_id, concept_id)


def record_verification_evidence(
    student_id: int, concept_id: int, score: float, passed: bool, source: str = "follow_up"
) -> int:
    """Persist a verification outcome as real evidence and return its id —
    used by the orchestrator so REPAID/REGRESSED gates have something to
    point at ("LLM proposes. Evidence decides.")."""
    return int(
        add_evidence(student_id, concept_id, source, float(score), bool(passed))["id"]
    )


# --------------------------------------------------------------------------
# debt lookup
# --------------------------------------------------------------------------

def _concept_exists(concept_id: int):
    from database.models import Concept

    session = _new_session()
    try:
        return session.get(Concept, concept_id)
    finally:
        session.close()


def get_or_create_debt(
    student_id: Optional[int] = None,
    concept_id: Optional[int] = None,
    debt_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Mock-compatible lookup: by (student, concept) or by debt_id.

    When a debt_id is requested on its own, an existing row is returned and a
    missing one yields None (callers raise 404) — the mock fabricated phantom
    rows here, which silently corrupted lookups.
    """
    if debt_id is not None and (student_id is None or concept_id is None):
        return _debt_with_interventions(repo.get_debt(debt_id))
    if student_id is None or concept_id is None:
        return None
    _ensure_student(student_id)
    _ensure_concept(concept_id)
    debt = repo.get_or_create_debt(student_id, concept_id)
    return _debt_with_interventions(debt)


def _concept_exists(concept_id: int):
    session = _new_session()
    try:
        return session.get(Prerequisite.__table__.metadata.tables["concepts"], concept_id)
    finally:
        session.close()


def get_debt_by_id(debt_id: int) -> Optional[Dict[str, Any]]:
    return _debt_with_interventions(repo.get_debt(debt_id))


def get_debt_ledger(student_id: int) -> List[Dict[str, Any]]:
    return [
        _debt_with_interventions(d) for d in repo.get_debt_ledger(student_id)
    ]


# --------------------------------------------------------------------------
# state transitions (BFS-walk over the REAL lifecycle, gates stay strict)
# --------------------------------------------------------------------------

def _shortest_path(current: DebtStatus, target: DebtStatus) -> Optional[List[DebtStatus]]:
    """BFS through VALID_TRANSITIONS; None if unreachable."""
    if current is target:
        return []
    queue = deque([(current, [])])
    seen = {current}
    while queue:
        state, path = queue.popleft()
        for nxt in VALID_TRANSITIONS.get(state, set()):
            if nxt in seen:
                continue
            if nxt is target:
                return path + [nxt]
            seen.add(nxt)
            queue.append((nxt, path + [nxt]))
    return None


def update_debt_status(
    debt_id: int, new_status: str, evidence_id: Optional[int] = None
) -> Dict[str, Any]:
    """Move a debt with full lifecycle validation on the REAL database.

    * NEW_INTERVENTION is treated as INTERVENTION_PROPOSED (canonical name).
    * Ordinary targets may walk several legal hops (each hop validated and
      audited by the repository), e.g. INTERVENTION_PROPOSED -> IN_INTERVENTION
      legitimately passes through MENTOR_REVIEW.
    * Gated targets (REPAID / REGRESSED / ESCALATED) are direct-edge only and
      keep their evidence gates: passing evidence id, failing evidence id,
      retry-limit reached.
    """
    target_name = _STATE_ALIASES.get(new_status, new_status)
    target = normalize_status(target_name)

    debt = repo.get_debt(debt_id)
    if debt is None:
        raise _BridgeError(f"Debt id={debt_id} does not exist")
    current = normalize_status(debt["status"])

    if current is target:
        return _debt_with_interventions(repo.get_debt(debt_id))

    if target in _GATED:
        # strict, single-hop only — the repository enforces its evidence gate
        return _debt_with_interventions(
            repo.update_debt_status(debt_id, target, evidence_id=evidence_id)
        )

    path = _shortest_path(current, target)
    if path is None:
        raise _BridgeError(
            f"Illegal state transition from {current.value} -> {target.value}"
        )
    for step in path:
        debt_dict = repo.update_debt_status(debt_id, step, evidence_id=evidence_id)
    if target is DebtStatus.CONFIRMED_DEBT:
        debt_dict = _assign_severity_from_evidence(debt_dict)
    return _debt_with_interventions(debt_dict)


def _assign_severity_from_evidence(debt_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Derive LOW/MEDIUM/HIGH from the evidence average (HIGH below 45,
    MEDIUM below 60) so the ledger/UI show severity without the agents
    having to know about persistence details."""
    try:
        history = repo.get_evidence_history(debt_dict["student_id"], debt_dict["concept_id"])
        avg = sum(h["score"] for h in history) / len(history) if history else 100.0
        label = "HIGH" if avg < 45 else ("MEDIUM" if avg < 60 else "LOW")
        return repo.update_debt_severity(debt_dict["id"], label)
    except Exception:  # severity is cosmetic — never block the transition
        return debt_dict


# --------------------------------------------------------------------------
# interventions, mentor reviews, audit
# --------------------------------------------------------------------------

def record_intervention(
    debt_id: int, version, content: Dict[str, Any]
) -> Dict[str, Any]:
    """Mock uses int versions (1, 2, ...) — canonical storage is 'V1', 'V2'."""
    if isinstance(version, int):
        version = f"V{version}"
    iv = repo.record_intervention(debt_id, version, content)
    return _mock_intervention_dict(iv)


def record_mentor_review(
    intervention_id: int,
    decision: str,
    edited_content: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """API sends approve/edit/reject; canonical decisions are approved/edited/rejected."""
    decision = _MENTOR_DECISION_MAP.get(str(decision).lower(), str(decision).lower())
    review = repo.record_mentor_review(intervention_id, decision, edited_content)
    review = dict(review)
    review["decision"] = review["decision"].upper()
    return review


def get_pending_interventions() -> List[Dict[str, Any]]:
    """Mentor panel: interventions awaiting human review."""
    pending = [iv for iv in _all_interventions() if iv["mentor_status"] == "PENDING"]
    return pending


def _all_interventions() -> List[Dict[str, Any]]:
    from database.models import Intervention

    session = _new_session()
    try:
        rows = (
            session.query(Intervention)
            .order_by(Intervention.created_at.asc(), Intervention.id.asc())
            .all()
        )
        return [_mock_intervention_dict({
            "id": r.id, "debt_id": r.debt_id, "version": r.version,
            "content": r.content, "mentor_status": r.mentor_status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }) for r in rows]
    finally:
        session.close()


def log_event(
    student_id: int,
    event_type: str,
    payload: Optional[Dict[str, Any]],
    debt_id: Optional[int] = None,
) -> Dict[str, Any]:
    return repo.log_event(student_id, event_type, payload or {}, debt_id=debt_id)


def get_events_for_debt(debt_id: int) -> List[Dict[str, Any]]:
    from database.models import Event

    session = _new_session()
    try:
        rows = (
            session.query(Event)
            .where(Event.debt_id == debt_id)
            .order_by(Event.timestamp.asc(), Event.id.asc())
            .all()
        )
        return [
            {
                "id": r.id,
                "student_id": r.student_id,
                "debt_id": r.debt_id,
                "event_type": r.event_type,
                "payload": r.payload,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in rows
        ]
    finally:
        session.close()


def get_prerequisites(concept_id: int) -> List[Dict[str, Any]]:
    """Prerequisite chain entries for a concept (diagnosis agent input)."""
    from database.models import Concept
    session = _new_session()
    try:
        rows = (
            session.query(Prerequisite, Concept.name)
            .outerjoin(Concept, Concept.id == Prerequisite.prerequisite_concept_id)
            .where(Prerequisite.concept_id == concept_id)
            .all()
        )
        return [
            {
                "concept_id": r.Prerequisite.concept_id,
                "prerequisite_concept_id": r.Prerequisite.prerequisite_concept_id,
                "prerequisite_id": r.Prerequisite.prerequisite_concept_id,
                "id": r.Prerequisite.prerequisite_concept_id,
                "prerequisite_name": r.name or f"Concept #{r.Prerequisite.prerequisite_concept_id}",
                "name": r.name or f"Concept #{r.Prerequisite.prerequisite_concept_id}",
            }
            for r in rows
        ]
    finally:
        session.close()



