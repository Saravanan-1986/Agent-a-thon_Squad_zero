"""
Fallback In-Memory Repository for standalone backend operation / testing.
Used seamlessly if database.repository is not yet merged by Member 2.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from backend.state.state_machine import validate_transition

_students_db: Dict[int, Dict[str, Any]] = {}
_evidence_db: List[Dict[str, Any]] = []
_debts_db: Dict[int, Dict[str, Any]] = {}
_interventions_db: List[Dict[str, Any]] = []
_mentor_reviews_db: List[Dict[str, Any]] = []
_events_db: List[Dict[str, Any]] = []
_prerequisites_db: Dict[int, List[Dict[str, Any]]] = {}

_student_id_counter = 1
_debt_id_counter = 1
_evidence_id_counter = 1
_intervention_id_counter = 1

def create_student(name: str = "", email: str = "", external_id: Optional[str] = None) -> Dict[str, Any]:
    global _student_id_counter
    ext_id = external_id or email or f"S_{name.lower().replace(' ', '_')}"
    em = email or ext_id
    s = {"id": _student_id_counter, "external_id": ext_id, "name": name, "email": em, "created_at": datetime.now()}
    _students_db[_student_id_counter] = s
    _student_id_counter += 1
    return s

def get_student(student_id: int) -> Optional[Dict[str, Any]]:
    return _students_db.get(student_id)

def list_students() -> List[Dict[str, Any]]:
    return list(_students_db.values())

def add_evidence(student_id: int, concept_id: int, source: str, score: float, passed: bool) -> Dict[str, Any]:
    global _evidence_id_counter
    ev = {
        "id": _evidence_id_counter,
        "student_id": student_id,
        "concept_id": concept_id,
        "source": source,
        "score": score,
        "passed": passed,
        "timestamp": datetime.now()
    }
    _evidence_id_counter += 1
    _evidence_db.append(ev)
    return ev

def get_evidence_history(student_id: int, concept_id: int) -> List[Dict[str, Any]]:
    return [e for e in _evidence_db if e["student_id"] == student_id and e["concept_id"] == concept_id]

def get_all_student_evidence(student_id: int) -> List[Dict[str, Any]]:
    return [e for e in _evidence_db if e["student_id"] == student_id]

def get_debt_by_id(debt_id: int) -> Optional[Dict[str, Any]]:
    return _debts_db.get(debt_id)

def get_or_create_debt(student_id: Optional[int] = None, concept_id: Optional[int] = None, debt_id: Optional[int] = None) -> Dict[str, Any]:
    global _debt_id_counter
    if debt_id:
        if debt_id in _debts_db:
            return _debts_db[debt_id]
        # If debt_id specifically requested does not exist, return None or create only if student/concept provided
        if student_id is None or concept_id is None:
            return None
    
    for d in _debts_db.values():
        if d["student_id"] == student_id and d["concept_id"] == concept_id:
            return d

    new_d = {
        "id": debt_id or _debt_id_counter,
        "student_id": student_id or 1,
        "concept_id": concept_id or 1,
        "status": "CLEAR",
        "severity": 0.0,
        "attempts": 0,
        "failed_interventions": 0,
        "root_cause_concept_id": concept_id,
        "interventions": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    if not debt_id:
        _debt_id_counter += 1
    _debts_db[new_d["id"]] = new_d
    return new_d


def update_debt_status(debt_id: int, new_status: str, evidence_id: Optional[int] = None) -> Dict[str, Any]:
    debt = _debts_db.get(debt_id)
    if not debt:
        debt = get_or_create_debt(debt_id=debt_id)
    
    current_status = debt.get("status", "CLEAR")
    validate_transition(current_status, new_status)
    
    debt["status"] = new_status
    debt["updated_at"] = datetime.now()
    return debt

def record_intervention(debt_id: int, version: int, content: Dict[str, Any]) -> Dict[str, Any]:
    global _intervention_id_counter
    inter = {
        "id": _intervention_id_counter,
        "debt_id": debt_id,
        "version": version,
        "content": content,
        "mentor_status": "PENDING",
        "created_at": datetime.now()
    }
    _intervention_id_counter += 1
    _interventions_db.append(inter)
    
    debt = _debts_db.get(debt_id)
    if debt:
        debt.setdefault("interventions", []).append(inter)
    return inter

def record_mentor_review(intervention_id: int, decision: str, edited_content: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    for inter in _interventions_db:
        if inter["id"] == intervention_id:
            inter["mentor_status"] = decision.upper()
            if edited_content:
                inter["content"] = edited_content
            _mentor_reviews_db.append({
                "intervention_id": intervention_id,
                "decision": decision,
                "edited_content": edited_content,
                "timestamp": datetime.now()
            })
            return inter
    return {"id": intervention_id, "mentor_status": decision.upper()}

def log_event(student_id: int, event_type: str, payload: Dict[str, Any], debt_id: Optional[int] = None) -> Dict[str, Any]:
    evt = {
        "id": len(_events_db) + 1,
        "student_id": student_id,
        "debt_id": debt_id,
        "event_type": event_type,
        "payload": payload,
        "timestamp": datetime.now()
    }
    _events_db.append(evt)
    return evt

def get_debt_ledger(student_id: int) -> List[Dict[str, Any]]:
    return [d for d in _debts_db.values() if d["student_id"] == student_id]

def get_prerequisites(concept_id: int) -> List[Dict[str, Any]]:
    return _prerequisites_db.get(concept_id, [])

def get_events_for_debt(debt_id: int) -> List[Dict[str, Any]]:
    return [e for e in _events_db if e.get("debt_id") == debt_id]

def reset_repository():
    """Resets in-memory state for clean test runs."""
    global _student_id_counter, _debt_id_counter, _evidence_id_counter, _intervention_id_counter
    _students_db.clear()
    _evidence_db.clear()
    _debts_db.clear()
    _interventions_db.clear()
    _mentor_reviews_db.clear()
    _events_db.clear()
    _prerequisites_db.clear()
    _student_id_counter = 1
    _debt_id_counter = 1
    _evidence_id_counter = 1
    _intervention_id_counter = 1

