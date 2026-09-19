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
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "~anthropic/claude-sonnet-latest"


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

    api_key = os.getenv("OPENROUTER_API_KEY", "")
    model = os.getenv("SLICE_FALLBACK_MODEL", DEFAULT_MODEL)
    is_test_mode = os.getenv("KNOWLEDGE_DEBT_TEST_MODE", "").lower() in ["true", "1", "yes"]

    if is_test_mode:
        return _build_fallback_intervention(version_num, concept_id, root_cause_id, strategy_focus)

    # Attempt LLM call if key is available and test mode is not enabled
    if api_key:

        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.3
            }
            with httpx.Client(timeout=25.0) as client:
                resp = client.post(OPENROUTER_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    logger.info("OpenRouter response: status=200 model=%s", model)
                    data = resp.json()
                    content_str = data["choices"][0]["message"]["content"] or ""
                    
                    # Clean markdown code block wrapper if present
                    content_str = content_str.strip()
                    if content_str.startswith("```"):
                        lines = content_str.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        content_str = "\n".join(lines).strip()

                    try:
                        parsed = json.loads(content_str)
                        parsed["version"] = version_num
                        logger.info("OpenRouter LLM intervention generated successfully")
                        return parsed
                    except Exception as parse_err:
                        logger.warning("OpenRouter response JSON parsing error: %s", parse_err)
                else:
                    safe_body = resp.text[:200] if resp.text else ""
                    logger.warning("OpenRouter request failed: status=%s body=%s", resp.status_code, safe_body)
        except Exception as e:
            logger.warning("LLM API call failed: %s. Falling back to template.", e)

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
