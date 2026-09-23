"""
Evidence API Router
"""

from fastapi import APIRouter, HTTPException, status
from backend.schemas.evidence import EvidenceCreate
from backend.agents.orchestrator import Orchestrator

router = APIRouter(prefix="/evidence", tags=["Evidence"])
orchestrator = Orchestrator()

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_evidence(payload: EvidenceCreate):
    """
    Submits student evidence for analysis by Evidence, Diagnosis, and Intervention Agents.
    """
    try:
        result = orchestrator.process_new_evidence(
            student_id=payload.student_id,
            concept_id=payload.concept_id,
            evidence_data=payload.model_dump()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evidence processing failed: {str(e)}")


@router.get("/student/{student_id}")
def fetch_student_evidence(student_id: str):
    """
    Returns full database evidence audit trail for a student across all concepts.
    """
    sid = int(student_id) if student_id.isdigit() else 1
    import os
    if os.getenv("KNOWLEDGE_DEBT_USE_MOCK", "").lower() in ("1", "true", "yes"):
        from backend.services.mock_repository import get_all_student_evidence
    else:
        from database.compat import get_all_student_evidence
    
    evidence_rows = get_all_student_evidence(sid)
    
    from database import repository
    result = []
    for ev in evidence_rows:
        cid = ev.get("concept_id")
        concept_name = "Diagnostic Assessment"
        if cid:
            try:
                c = repository.get_concept(cid)
                if c:
                    concept_name = c.get("name", concept_name)
            except Exception:
                pass
        
        source_val = ev.get("source") or "quiz"
        score_val = ev.get("score", 0.0)
        passed_val = ev.get("passed", False)
        
        ts = ev.get("timestamp", "")
        if hasattr(ts, "strftime"):
            ts_str = ts.strftime("%Y-%m-%d %H:%M")
        else:
            ts_str = str(ts)
            
        result.append({
            "id": f"ev-{ev.get('id')}",
            "student_id": sid,
            "concept_id": cid,
            "concept": concept_name,
            "concept_name": concept_name,
            "source": str(source_val).capitalize() if isinstance(source_val, str) else "Quiz",
            "score": round(float(score_val), 1) if score_val is not None else 0.0,
            "passed": bool(passed_val),
            "timestamp": ts_str,
            "detail": f"Database evidence logged for {concept_name}."
        })
    return result

