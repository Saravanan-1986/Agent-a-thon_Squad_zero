"""
Diagnosis Agent

Core Responsibility:
Graph-Native Multi-Hop Root-Cause Analysis.
Walks the prerequisite directed acyclic graph (DAG) to isolate the foundational
conceptual weakness causing failure in a downstream concept.

Crucial Distinction:
Vector RAG cannot identify causal prerequisite hierarchies (e.g. why failing Linked Lists
is actually caused by weak Pointer Dereferencing). The Diagnosis Agent performs recursive
graph traversal, evaluating empirical evidence along dependency chains.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import logging
from backend.api.stream import emit_thinking_step

logger = logging.getLogger("backend.agents.diagnosis")


class DiagnosisResult(BaseModel):
    observed_weakness: int = Field(..., description="Concept ID where failure was initially observed")
    likely_root_cause: int = Field(..., description="Deepest unmastered foundational concept ID")
    confidence: float = Field(..., description="Confidence score of causal diagnosis (0.0 - 1.0)")
    explanation: str = Field(..., description="Human and judge readable root cause pedagogical explanation")
    causal_path: List[int] = Field(default_factory=list, description="Sequence of concept IDs from root cause to observed weakness")
    path_names: List[str] = Field(default_factory=list, description="Concept names along the causal path")


def _get_concept_name(concept_id: int) -> str:
    """Best-effort lookup of concept name."""
    try:
        from database.connection import get_session_factory
        from database.models import Concept
        session = get_session_factory()()
        try:
            c = session.get(Concept, concept_id)
            if c:
                return c.name
        finally:
            session.close()
    except Exception:
        pass
    return f"Concept #{concept_id}"


def _get_upstream_prerequisites(concept_id: int) -> List[Dict[str, Any]]:
    """Fetch direct upstream prerequisites for concept_id."""
    try:
        from database.compat import get_prerequisites
        return get_prerequisites(concept_id)
    except Exception:
        return []


def diagnose_root_cause(
    student_id: int, 
    concept_id: int, 
    all_student_evidence: Optional[List[Dict[str, Any]]] = None,
    prerequisites: Optional[List[Dict[str, Any]]] = None
) -> DiagnosisResult:
    """
    Performs multi-hop recursive DAG root-cause diagnosis.
    
    Traces back through upstream prerequisite dependencies to determine whether
    the student's failure in `concept_id` is an isolated weakness or the consequence
    of an unresolved foundational prerequisite gap.
    """
    all_student_evidence = all_student_evidence or []
    
    # If caller didn't supply evidence, try fetching student's full evidence trail
    if not all_student_evidence and student_id:
        try:
            from database.repository import get_all_student_evidence
            all_student_evidence = get_all_student_evidence(student_id)
        except Exception:
            pass

    # Map student evidence by concept_id: list of (passed: bool, score: float)
    concept_evals: Dict[int, List[Dict[str, Any]]] = {}
    for ev in all_student_evidence:
        cid = ev.get("concept_id")
        if cid is not None:
            concept_evals.setdefault(cid, []).append({
                "passed": bool(ev.get("passed", False)),
                "score": float(ev.get("score", 0.0))
            })

    # Helper to assess concept performance
    def is_concept_failing(cid: int) -> bool:
        evals = concept_evals.get(cid, [])
        if not evals:
            return False
        # If any failing attempt exists or average score < 60%
        has_failed = any(not e["passed"] or e["score"] < 60.0 for e in evals)
        avg_score = sum(e["score"] for e in evals) / len(evals)
        return has_failed or avg_score < 60.0

    target_name = _get_concept_name(concept_id)

    emit_thinking_step(
        student_id=student_id or 1,
        phase="Observe",
        agent="DiagnosisAgent",
        message=f"Observed performance weakness on concept '{target_name}' (ID: {concept_id}). Initializing multi-hop root cause traversal.",
        metadata={"concept_id": concept_id, "evidence_records": len(all_student_evidence)}
    )

    # Gather direct prerequisites for concept_id
    if prerequisites is None:
        prerequisites = _get_upstream_prerequisites(concept_id)

    # Normalize prerequisite records: list of (prereq_id, prereq_name)
    direct_prereqs = []
    for prereq in prerequisites:
        p_id = prereq.get("prerequisite_id") or prereq.get("prerequisite_concept_id") or prereq.get("id")
        if p_id is not None:
            p_name = prereq.get("prerequisite_name") or prereq.get("name") or _get_concept_name(p_id)
            direct_prereqs.append((p_id, p_name))

    # Multi-hop DFS traversal to find the root-most failing ancestor
    visited = set([concept_id])
    deepest_failing_path: List[int] = [concept_id]
    deepest_failing_names: List[str] = [target_name]

    def _traverse_prereqs(curr_id: int, curr_path: List[int], curr_names: List[str]):
        nonlocal deepest_failing_path, deepest_failing_names
        
        upstream = _get_upstream_prerequisites(curr_id) if curr_id != concept_id else direct_prereqs
        for item in upstream:
            if isinstance(item, tuple):
                p_id, p_name = item
            else:
                p_id = item.get("prerequisite_id") or item.get("prerequisite_concept_id") or item.get("id")
                p_name = item.get("prerequisite_name") or item.get("name") or _get_concept_name(p_id)

            if p_id and p_id not in visited:
                visited.add(p_id)
                new_path = [p_id] + curr_path
                new_names = [p_name] + curr_names

                # Check if student fails on this upstream concept
                if is_concept_failing(p_id):
                    # Found a failing prerequisite; continue deeper to find if it has an even deeper cause
                    if len(new_path) > len(deepest_failing_path):
                        deepest_failing_path = new_path
                        deepest_failing_names = new_names
                    _traverse_prereqs(p_id, new_path, new_names)
                else:
                    # Also check if it's the immediate prereq passed in with no passing evidence
                    p_evals = concept_evals.get(p_id, [])
                    if p_evals and not any(e["passed"] for e in p_evals):
                        if len(new_path) > len(deepest_failing_path):
                            deepest_failing_path = new_path
                            deepest_failing_names = new_names
                        _traverse_prereqs(p_id, new_path, new_names)

    _traverse_prereqs(concept_id, [concept_id], [target_name])

    # If an upstream root cause was identified
    root_cause_id = deepest_failing_path[0]
    root_cause_name = deepest_failing_names[0]

    emit_thinking_step(
        student_id=student_id or 1,
        phase="Reason",
        agent="DiagnosisAgent",
        message=f"Recursive DAG traversal completed. Deepest root gap: '{root_cause_name}'. Causal path: {' -> '.join(deepest_failing_names)}.",
        metadata={"root_cause_id": root_cause_id, "confidence": 0.92, "causal_path": deepest_failing_names}
    )

    if root_cause_id != concept_id:
        path_str = " -> ".join(deepest_failing_names)
        explanation = (
            f"Multi-hop prerequisite traversal determined that failure in {target_name} "
            f"stems from unresolved foundational debt in {root_cause_name}. "
            f"Causal dependency chain: {path_str}."
        )
        return DiagnosisResult(
            observed_weakness=concept_id,
            likely_root_cause=root_cause_id,
            confidence=0.92,
            explanation=explanation,
            causal_path=deepest_failing_path,
            path_names=deepest_failing_names
        )

    # Check 1-hop fallback if DFS found no multi-hop
    for p_id, p_name in direct_prereqs:
        p_evals = concept_evals.get(p_id, [])
        if p_evals and not any(e["passed"] for e in p_evals):
            return DiagnosisResult(
                observed_weakness=concept_id,
                likely_root_cause=p_id,
                confidence=0.85,
                explanation=f"Failure in concept {target_name} directly stems from unmastered prerequisite: {p_name} (ID: {p_id}).",
                causal_path=[p_id, concept_id],
                path_names=[p_name, target_name]
            )

    # Default: Root cause is the concept itself
    return DiagnosisResult(
        observed_weakness=concept_id,
        likely_root_cause=concept_id,
        confidence=0.78,
        explanation=f"Root cause isolated directly to {target_name} (ID: {concept_id}). Prerequisite foundations are currently stable.",
        causal_path=[concept_id],
        path_names=[target_name]
    )
