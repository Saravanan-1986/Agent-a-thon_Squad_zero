"""
Real-Time Observability & SSE Streaming Router

Emits and streams agent thinking steps:
[Observe] -> [Reason] -> [Act] -> [Verify] -> [Adapt]

Provides Server-Sent Events (SSE) for the frontend SystemTraceDrawer
and real-time event distribution.
"""

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["Observability Stream"])

# In-memory ring buffer for thinking step traces per student
_THINKING_TRACES: Dict[int, List[Dict[str, Any]]] = {}

# Active SSE subscriber queues per student
_SUBSCRIBERS: Dict[int, List[asyncio.Queue]] = {}


def emit_thinking_step(
    student_id: int,
    phase: str,
    agent: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Records a structured agent thinking step and broadcasts to all active SSE subscribers.
    Phase must be one of: 'Observe', 'Reason', 'Act', 'Verify', 'Adapt'.
    """
    valid_phases = ["Observe", "Reason", "Act", "Verify", "Adapt"]
    if phase not in valid_phases:
        phase = "Act"

    entry = {
        "id": f"step-{int(datetime.now().timestamp() * 1000)}",
        "student_id": student_id,
        "phase": phase,
        "agent": agent,
        "message": message,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "metadata": metadata or {}
    }

    # Store in history buffer (cap at 100 per student)
    buf = _THINKING_TRACES.setdefault(student_id, [])
    buf.append(entry)
    if len(buf) > 100:
        buf.pop(0)

    # Broadcast to active SSE listeners
    queues = _SUBSCRIBERS.get(student_id, [])
    for q in list(queues):
        try:
            q.put_nowait(entry)
        except asyncio.QueueFull:
            pass

    return entry


def get_thinking_history(student_id: int) -> List[Dict[str, Any]]:
    """Returns stored thinking steps for a student."""
    return list(_THINKING_TRACES.get(student_id, []))


@router.get("/api/system/trace/{student_id}/thinking")
def get_student_thinking_steps(student_id: str):
    """
    REST endpoint returning structured thinking steps for a student:
    [Observe] -> [Reason] -> [Act] -> [Verify] -> [Adapt].
    """
    sid = int(student_id) if student_id.isdigit() else 1
    history = get_thinking_history(sid)

    # Seed default lifecycle demonstration steps if empty
    if not history:
        _seed_demo_thinking_lifecycle(sid)
        history = get_thinking_history(sid)

    return {
        "student_id": sid,
        "count": len(history),
        "steps": history
    }


@router.get("/api/system/trace/{student_id}/stream")
async def stream_student_trace(student_id: str):
    """
    Server-Sent Events (SSE) streaming endpoint for live agent observability.
    Pushes thinking steps and audit records as they happen.
    """
    sid = int(student_id) if student_id.isdigit() else 1
    queue: asyncio.Queue = asyncio.Queue(maxsize=50)

    _SUBSCRIBERS.setdefault(sid, []).append(queue)

    async def event_generator():
        try:
            # 1. Initial snapshot of recent steps
            history = get_thinking_history(sid)
            if not history:
                _seed_demo_thinking_lifecycle(sid)
                history = get_thinking_history(sid)

            for step in history[-10:]:
                payload = json.dumps(step)
                yield f"event: thinking_step\ndata: {payload}\n\n"

            # 2. Stream live steps
            while True:
                try:
                    step = await asyncio.wait_for(queue.get(), timeout=15.0)
                    payload = json.dumps(step)
                    yield f"event: thinking_step\ndata: {payload}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat comment to keep connection alive
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if sid in _SUBSCRIBERS and queue in _SUBSCRIBERS[sid]:
                _SUBSCRIBERS[sid].remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


def _seed_demo_thinking_lifecycle(student_id: int):
    """Seeds canonical agent thinking steps illustrating the 5-phase lifecycle."""
    emit_thinking_step(
        student_id=student_id,
        phase="Observe",
        agent="DiagnosisAgent",
        message="Observed 2 failing attempts on concept 'Pointer Dereferencing' (Scores: 42%, 45%).",
        metadata={"concept_code": "DSA-PTR-DEREF", "severity": "HIGH"}
    )
    emit_thinking_step(
        student_id=student_id,
        phase="Reason",
        agent="DiagnosisAgent",
        message="Traversing prerequisite DAG upstream: Linked List Traversal -> Pointer Dereferencing -> Memory Model. Isolated root cause.",
        metadata={"causal_path": ["Pointer Dereferencing", "Memory Model"], "confidence": 0.92}
    )
    emit_thinking_step(
        student_id=student_id,
        phase="Act",
        agent="InterventionAgent",
        message="Synthesizing Intervention V2: Verification failed on V1 text. Autonomously adapted strategy to Interactive RAM Simulation.",
        metadata={"version": 2, "strategy": "Visual Memory Simulation & Pointer Tracing"}
    )
    emit_thinking_step(
        student_id=student_id,
        phase="Verify",
        agent="VerificationAgent",
        message="Administering fresh transfer verification challenge. Student submitted answer demonstrating pointer arithmetic.",
        metadata={"score": 88.0, "status": "PASS"}
    )
    emit_thinking_step(
        student_id=student_id,
        phase="Adapt",
        agent="Orchestrator",
        message="Passing empirical evidence validated (88% >= 70%). Deterministic state machine retired debt to REPAID.",
        metadata={"transition": "VERIFYING -> REPAID", "rule": "LLM proposes. Evidence decides."}
    )
