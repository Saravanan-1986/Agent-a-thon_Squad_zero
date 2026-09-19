"""
Diagnosis Agent

Responsibilities:
1. Performs root-cause analysis by walking the prerequisite graph for a concept.
2. Identifies if the failure in concept X stems from a missing foundational prerequisite Y.
3. Returns structured diagnosis for targeted intervention.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class DiagnosisResult(BaseModel):
    observed_weakness: int
    likely_root_cause: int
    confidence: float
    explanation: str

def diagnose_root_cause(
    student_id: int, 
    concept_id: int, 
    all_student_evidence: List[Dict[str, Any]] = None,
    prerequisites: List[Dict[str, Any]] = None
) -> DiagnosisResult:
    """
    Diagnoses whether the root cause of concept_id failure is an unmastered prerequisite.
    
    prerequisites format: list of dicts like {'concept_id': int, 'prerequisite_id': int, 'prerequisite_name': str}
    """
    all_student_evidence = all_student_evidence or []
    prerequisites = prerequisites or []

    # Map student evidence by concept_id
    concept_performance = {}
    for ev in all_student_evidence:
        cid = ev.get("concept_id")
        if cid not in concept_performance:
            concept_performance[cid] = []
        concept_performance[cid].append(ev.get("passed", True) and float(ev.get("score", 100)) >= 50.0)

    # Check prerequisites for failures
    for prereq in prerequisites:
        p_id = prereq.get("prerequisite_id")
        p_name = prereq.get("prerequisite_name", f"Concept #{p_id}")
        
        p_evals = concept_performance.get(p_id, [])
        # If prerequisite has failing evidence or no passing evidence
        if p_evals and not any(p_evals):
            return DiagnosisResult(
                observed_weakness=concept_id,
                likely_root_cause=p_id,
                confidence=0.85,
                explanation=f"Failure in concept {concept_id} likely stems from unmastered prerequisite: {p_name} (ID: {p_id})."
            )

    # Default: Root cause is the concept itself
    return DiagnosisResult(
        observed_weakness=concept_id,
        likely_root_cause=concept_id,
        confidence=0.75,
        explanation=f"Root cause isolated directly to concept ID {concept_id}."
    )
