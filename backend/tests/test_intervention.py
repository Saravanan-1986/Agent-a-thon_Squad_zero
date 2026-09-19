import pytest
from backend.agents.intervention_agent import generate_intervention

def test_intervention_v1_generation():
    inter_v1 = generate_intervention(debt_id=1, concept_id=10, root_cause_id=10, previous_versions=[])
    assert inter_v1["version"] == 1
    assert "strategy" in inter_v1
    assert "concept_explanation" in inter_v1
    assert "practice_questions" in inter_v1

def test_intervention_v2_adapts_strategy():
    v1_content = {
        "version": 1,
        "strategy": "Text explanation and standard multiple-choice questions.",
        "concept_explanation": "Basic overview",
        "practice_questions": []
    }
    inter_v2 = generate_intervention(debt_id=1, concept_id=10, root_cause_id=10, previous_versions=[{"content": v1_content}])
    assert inter_v2["version"] == 2
    assert inter_v2["strategy"] != v1_content["strategy"], "V2 MUST change strategy after V1 failure."
    assert "Alternative Strategy" in inter_v2["strategy"] or "debugging" in inter_v2["strategy"].lower() or "tracing" in inter_v2["strategy"].lower()
