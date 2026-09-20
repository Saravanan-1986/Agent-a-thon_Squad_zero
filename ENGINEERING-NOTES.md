# Engineering Notes & Internal Implementation Pivots

This document records technical architecture changes, API adjustments, and internal optimizations made during development.

---

## Technical Pivots Log

### 1. Introduction of Explicit 3-Point Lesson Critic Agent
- **Component**: `backend/agents/lesson_critic.py`, `backend/agents/intervention_agent.py`
- **Reason**: Internal verification revealed that generating remediation lessons without an explicit pre-delivery critic allowed text-heavy drafts to reach the student without guaranteed checkable exercises. Added `LessonCritic` to evaluate drafts against a 3-point checklist (`targets_misconception`, `no_answer_leak`, `ends_with_checkable`), capping draft retries to max 2 loops before escalating to mentor state.

### 2. Standardization of Shared 0.80 (80.0%) Verification Threshold
- **Component**: `backend/state/state_machine.py`, `backend/agents/verification_agent.py`
- **Reason**: Initial verification scoring used 70.0 in some agent docstrings and 80.0 in state machine checks. Standardized to a single shared constant `VERIFICATION_PASS_THRESHOLD = 80.0` defined in `state_machine.py`.

### 3. OpenRouter Model Endpoint Mapping
- **Component**: `backend/services/multi_model_engine.py`
- **Reason**: Live test calls against OpenRouter revealed that older model identifier strings (`google/gemini-2.0-flash-lite-001`) returned HTTP 404 from OpenRouter. Updated default model mapping to `google/gemini-2.5-flash-lite` to guarantee HTTP 200 JSON evaluations.

### 4. Git Security Pre-Commit Hook Location
- **Component**: `scripts/hooks/pre-commit`
- **Reason**: Moved pre-commit hook into repository tracking under `scripts/hooks/pre-commit` and configured `git config core.hooksPath scripts/hooks` so key leak protection persists across developer setups.
