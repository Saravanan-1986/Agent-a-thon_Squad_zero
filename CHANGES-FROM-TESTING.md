# Design Changes From Testing Log

This file tracks every agent architecture, state machine, or evaluation threshold design change made as a result of empirical testing during the hackathon.

---

## Log Entries

### Change #1: Introduction of Explicit 3-Point Lesson Critic Agent
- **Date**: 2026-09-20
- **Component**: `backend/agents/lesson_critic.py`, `backend/agents/intervention_agent.py`
- **Reason**: Testing revealed that generating remediation lessons without an explicit pre-delivery critic allowed some text-heavy drafts to reach the student without guaranteed checkable exercises. We added `LessonCritic` to evaluate drafts against a 3-point checklist (`targets_misconception`, `no_answer_leak`, `ends_with_checkable`), capping draft retries to max 2 loops before escalating to mentor state.
- **Commit Hash**: `[Pending commit for Task 2]`

### Change #2: Standardization of Shared 0.80 (80.0%) Verification Threshold
- **Date**: 2026-09-20
- **Component**: `backend/state/state_machine.py`, `backend/agents/verification_agent.py`
- **Reason**: Initial verification scoring used 70.0 in some agent docstrings and 80.0 in state machine checks. To guarantee strict enforcement across all verification stages, we introduced a single shared constant `VERIFICATION_PASS_THRESHOLD = 80.0` defined in `state_machine.py` and consumed by all agents and API routes.
- **Commit Hash**: `[Pending commit for Task 2]`

### Change #3: OpenRouter Model Endpoint Mapping (`google/gemini-2.5-flash-lite`)
- **Date**: 2026-09-20
- **Component**: `backend/services/multi_model_engine.py`
- **Reason**: Live test calls against OpenRouter revealed that older model identifier strings (`google/gemini-2.0-flash-lite-001`) returned HTTP 404 from OpenRouter. Updating the default model mapping to `google/gemini-2.5-flash-lite` restored 100% HTTP 200 responses with valid structured JSON evaluations.
- **Commit Hash**: `[Pending commit for Task 2]`
