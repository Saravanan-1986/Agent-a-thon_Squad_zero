"""
Intervention Agent

Responsibilities:
1. Generates targeted educational interventions (concept explanations, diagrams/visuals, practice exercises).
2. Supports strategy adaptation on retry: when previous_versions exist, includes failure reasoning
   in prompt to force a different pedagogical approach (e.g., text/MCQ -> diagram/code tracing).
3. Connects to OpenRouter/LLM API with robust structured JSON output handling and safe fallback.
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-3.5-sonnet"

def generate_intervention(
    debt_id: int,
    concept_id: int,
    root_cause_id: int,
    previous_versions: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generates a targeted intervention strategy.
    
    If previous_versions is provided (retry loop), includes failure reasoning
    and forces the LLM to change strategy.
    """
    previous_versions = previous_versions or []
    version_num = len(previous_versions) + 1

    strategy_focus = "Standard foundational explanation and multiple-choice practice."
    failure_context = ""

    if previous_versions:
        strategies_used = [v.get("content", {}).get("strategy", "Text explanation") for v in previous_versions]
        failure_context = (
            f"\n\nIMPORTANT - THIS IS A RETRY (Attempt #{version_num}).\n"
            f"Previous intervention strategies that failed: {', '.join(strategies_used)}.\n"
            f"You MUST change your teaching strategy completely. Do NOT reuse text explanations alone. "
            f"Shift to visual tracing, interactive code debugging, diagrammatic breakdowns, or step-by-step memory model execution."
        )
        strategy_focus = f"Alternative Strategy (Attempt #{version_num}): Code tracing, visual debugging, memory model diagram."

    system_prompt = (
        "You are an expert AI tutor in a Knowledge Debt Engine. "
        "Generate a structured educational intervention to repair a conceptual debt.\n"
        "Return strictly valid JSON matching this schema:\n"
        "{\n"
        '  "version": number,\n'
        '  "strategy": "string description of pedagogical approach",\n'
        '  "concept_explanation": "string",\n'
        '  "visual_diagram_markdown": "string mermaid or ascii diagram",\n'
        '  "practice_questions": [\n'
        '    {"id": 1, "question": "string", "options": ["A", "B", "C", "D"], "answer": "string"}\n'
        '  ]\n'
        "}"
    )

    user_prompt = (
        f"Generate Intervention Version {version_num} for Debt ID {debt_id}.\n"
        f"Target Concept ID: {concept_id}, Root Cause Concept ID: {root_cause_id}.\n"
        f"Strategy Focus: {strategy_focus}"
        f"{failure_context}"
    )

    # Attempt LLM call if key is available
    if OPENROUTER_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": os.getenv("SLICE_FALLBACK_MODEL", DEFAULT_MODEL),
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.3
            }
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(OPENROUTER_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content_str = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content_str)
                    parsed["version"] = version_num
                    return parsed
        except Exception as e:
            logger.warning(f"LLM API call failed or timed out: {e}. Falling back to template generation.")

    # Fallback template if API call is skipped or fails
    return _build_fallback_intervention(version_num, concept_id, root_cause_id, strategy_focus)


def _build_fallback_intervention(version: int, concept_id: int, root_cause_id: int, strategy: str) -> Dict[str, Any]:
    return {
        "version": version,
        "strategy": strategy,
        "concept_explanation": f"Detailed review for Concept #{concept_id} focusing on root cause #{root_cause_id} (Version {version}).",
        "visual_diagram_markdown": (
            "```mermaid\n"
            "graph TD;\n"
            f"   RootCause[{root_cause_id}] --> TargetConcept[{concept_id}];\n"
            "```"
        ),
        "practice_questions": [
            {
                "id": 1,
                "question": f"Key diagnostic question for Concept #{concept_id} (Attempt #{version})?",
                "options": ["A) Correct Application", "B) Common Misconception", "C) Syntax Error", "D) Out of Scope"],
                "answer": "A) Correct Application"
            },
            {
                "id": 2,
                "question": f"Debugging step targeting root cause #{root_cause_id}?",
                "options": ["A) Trace memory", "B) Ignore exception", "C) Recompile", "D) Hardcode result"],
                "answer": "A) Trace memory"
            }
        ]
    }
