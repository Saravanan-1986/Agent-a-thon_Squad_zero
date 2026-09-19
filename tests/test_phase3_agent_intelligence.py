"""
Test Suite for Phase 3: Advanced Agent Intelligence & Multi-Model Engine
Validates:
1. MultiModelEngine provider detection, Gemini REST, OpenRouter, and fallback.
2. Structured Strategy Evolution (V1 explanation/diagram/exercises -> V2 address simulation & debugging).
3. Thinking Trace Lifecycle: [Observe] -> [Reason] -> [Act] -> [Verify] -> [Adapt].
4. SSE Stream endpoint text/event-stream responses and initial snapshot.
5. VerificationAgent evaluation and state-machine integrity.
"""

import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.multi_model_engine import MultiModelEngine, engine
from backend.agents.intervention_agent import generate_intervention
from backend.agents.verification_agent import generate_verification_question, score_verification
from backend.api.stream import (
    emit_thinking_step,
    get_student_thinking_steps,
    get_thinking_history,
    stream_student_trace
)

client = TestClient(app)

def test_multimodel_engine_provider_detection():
    """Verify that MultiModelEngine accurately detects available providers."""
    test_engine = MultiModelEngine()
    status = test_engine.get_status()
    assert "active_provider" in status
    assert "active_model" in status
    assert status["fallback_enabled"] is True
    assert status["core_principle"] == "LLM proposes. Evidence decides."
    
    if test_engine.gemini_key:
        assert status["active_provider"] == "gemini"
        assert "gemini" in status["active_model"].lower()

def test_multimodel_engine_fallback_resilience():
    """Verify that engine gracefully falls back to None if keys are dummy or network fails."""
    dummy_engine = MultiModelEngine()
    dummy_engine.gemini_key = "invalid_fake_key_test_123"
    dummy_engine.openrouter_key = ""
    res = dummy_engine.generate_json("System prompt", "User prompt")
    assert res is None or isinstance(res, dict)

def test_intervention_v1_structure():
    """Verify V1 intervention produces explanation, memory diagram, and practice questions."""
    v1 = generate_intervention(
        debt_id=1,
        concept_id=48,  # DSA-PTR-BASICS
        root_cause_id=47,  # DSA-MEM-MODEL
        previous_versions=[]
    )
    assert v1["version"] == 1
    assert "strategy" in v1
    assert "concept_explanation" in v1
    assert "memory_diagram" in v1 or "diagram" in str(v1).lower()
    assert "practice_questions" in v1
    assert len(v1["practice_questions"]) > 0

def test_intervention_v2_adaptive_retry():
    """Verify V2 intervention adapts strategy to step-by-step address simulation & debugging."""
    v1_content = {
        "version": 1,
        "strategy": "Conceptual explanation + memory diagram + practice exercises",
        "concept_explanation": "Basic pointers explanation",
        "practice_questions": [{"question": "Q1"}]
    }
    v2 = generate_intervention(
        debt_id=1,
        concept_id=48,
        root_cause_id=47,
        previous_versions=[{"version": 1, "content": v1_content}]
    )
    assert v2["version"] == 2
    assert v2["strategy"] != v1_content["strategy"]
    strategy_lower = v2["strategy"].lower()
    assert any(k in strategy_lower for k in ["address", "simulation", "debug", "step-by-step", "trace", "ram"])
    assert "code_debugging_walkthrough" in v2 or "address_simulation" in v2 or "practice_questions" in v2

def test_thinking_trace_lifecycle_emission():
    """Verify emission of 5-phase thinking steps: [Observe] -> [Reason] -> [Act] -> [Verify] -> [Adapt]."""
    test_student_id = 9999
    phases = ["Observe", "Reason", "Act", "Verify", "Adapt"]
    for p in phases:
        emit_thinking_step(
            student_id=test_student_id,
            phase=p,
            agent="TestAgent",
            message=f"Executing {p} phase in test",
            metadata={"test_phase": p}
        )

    steps = get_thinking_history(test_student_id)
    emitted_phases = [s["phase"] for s in steps]
    for p in phases:
        assert p in emitted_phases

def test_thinking_trace_api_endpoint():
    """Verify GET /api/system/trace/{student_id}/thinking endpoint."""
    r = client.get("/api/system/trace/1/thinking")
    assert r.status_code == 200
    data = r.json()
    assert "steps" in data
    assert isinstance(data["steps"], list)
    assert len(data["steps"]) > 0

@pytest.mark.anyio
async def test_sse_stream_endpoint_async():
    """Verify stream_student_trace returns text/event-stream headers and yields thinking steps."""
    resp = await stream_student_trace("1")
    assert resp.media_type == "text/event-stream"
    assert resp.headers["Cache-Control"] == "no-cache"
    assert resp.headers["X-Accel-Buffering"] == "no"
    
    # Read the initial event from the generator
    gen = resp.body_iterator
    first_chunk = await anext(gen)
    assert "event: thinking_step" in first_chunk
    assert "data:" in first_chunk
    await gen.aclose()

def test_verification_agent_scoring():
    """Verify score_verification correctly scores answers and records thinking."""
    res_correct = score_verification(
        question="What does pointer dereferencing with * do in C/C++?",
        student_answer="Dereferencing a pointer using the * operator accesses the value stored at the memory address pointed to by the pointer.",
        student_id=1
    )
    assert "passed" in res_correct
    assert "score" in res_correct
    assert "feedback" in res_correct
    assert res_correct["passed"] is True
    assert res_correct["score"] >= 70.0

    res_incorrect = score_verification(
        question="What does pointer dereferencing with * do in C/C++?",
        student_answer="idk not sure",
        student_id=1
    )
    assert res_incorrect["passed"] is False
    assert res_incorrect["score"] < 70.0

def test_verification_question_generation():
    """Verify generate_verification_question produces valid transfer question."""
    vq = generate_verification_question(debt_id=1, concept_id=48, student_id=1)
    assert "question" in vq
    assert len(vq["question"]) > 10
