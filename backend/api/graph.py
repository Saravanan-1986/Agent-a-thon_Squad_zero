"""
Graph API Router

Provides full Directed Acyclic Graph (DAG) of educational concepts and prerequisite
relationships for dynamic interactive visualization.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query

from database import repository
from database.connection import get_session_factory
from database.models import Concept, Prerequisite, Subject, Debt, Evidence

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])


@router.get("/dsa")
def get_dsa_knowledge_graph(student_id: Optional[str] = Query(None, description="Optional student ID to overlay real-time learning state")):
    """
    Returns full interactive DAG nodes, edges, and real-time student debt states
    for the DSA curriculum.
    """
    session = get_session_factory()()
    try:
        dsa_subject = session.query(Subject).filter(Subject.code == "DSA").first()
        if not dsa_subject:
            return {"subject": "DSA", "nodes": [], "edges": [], "categories": []}

        concepts = (
            session.query(Concept)
            .filter(Concept.subject_id == dsa_subject.id)
            .order_by(Concept.id.asc())
            .all()
        )

        concept_ids = [c.id for c in concepts]

        # Query all prerequisite edges
        edges = (
            session.query(Prerequisite)
            .filter(Prerequisite.concept_id.in_(concept_ids))
            .all()
        )

        # Overlay student debt status and evidence trail if student_id is provided
        student_debt_map = {}
        evidence_map = {}
        if student_id:
            sid = int(student_id) if str(student_id).isdigit() else 1
            debts = (
                session.query(Debt)
                .filter(Debt.student_id == sid)
                .all()
            )
            for d in debts:
                student_debt_map[d.concept_id] = {
                    "debt_id": d.id,
                    "status": d.status.value if hasattr(d.status, "value") else str(d.status),
                    "severity": d.severity.value if hasattr(d.severity, "value") else str(d.severity) if d.severity else "LOW",
                    "attempts": d.attempts,
                    "failed_interventions": d.failed_interventions
                }

            evidences = (
                session.query(Evidence)
                .filter(Evidence.student_id == sid)
                .order_by(Evidence.timestamp.desc())
                .all()
            )
            for ev in evidences:
                evidence_map.setdefault(ev.concept_id, []).append({
                    "id": ev.id,
                    "source": ev.source.value if hasattr(ev.source, "value") else str(ev.source),
                    "score": round(ev.score, 1),
                    "passed": bool(ev.passed),
                    "response_time_seconds": ev.response_time_seconds,
                    "timestamp": ev.timestamp.strftime("%b %d, %H:%M") if ev.timestamp else "Recently"
                })

        # Categories list
        categories = sorted(list({c.category for c in concepts if c.category}))

        nodes_data = []
        for c in concepts:
            node = {
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "category": c.category or "General",
                "description": c.description,
                "difficulty": c.difficulty_baseline or 0.5,
                "status": student_debt_map.get(c.id, {}).get("status", "CLEAR"),
                "debt_info": student_debt_map.get(c.id, None),
                "evidence_trail": evidence_map.get(c.id, [])
            }
            nodes_data.append(node)

        edges_data = []
        for e in edges:
            edges_data.append({
                "source": e.prerequisite_concept_id,
                "target": e.concept_id,
                "relationship": e.relationship_type,
                "strength": e.strength
            })

        return {
            "subject": "DSA",
            "title": dsa_subject.title,
            "total_nodes": len(nodes_data),
            "total_edges": len(edges_data),
            "categories": categories,
            "nodes": nodes_data,
            "edges": edges_data
        }
    finally:
        session.close()
