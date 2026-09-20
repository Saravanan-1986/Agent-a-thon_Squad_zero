# Knowledge Debt Engine - Demo Pack & Presenter Cheat Sheet

This document contains the complete presenter pitch script, 1-slide outline, and judge Q&A cheat sheet for the hackathon presentation.

---

## 1. 5-Minute Pitch Script (Timed Flow)

### 0:00 - 0:30 | The Problem (30s)
> *"Standard learning platforms treat all student errors equally. If a student misses a Linked List question, traditional software serves another Linked List quiz. But in computer science, failure on a downstream topic is almost always caused by an unaddressed **prerequisite debt**—like pointer dereferencing or memory allocation. 
> The Knowledge Debt Engine autonomously traces causal dependencies upstream to diagnose root causes, adapts pedagogical strategies when students fail, and strictly gates state transitions with empirical verification."*

### 0:30 - 2:30 | Live Agentic Run (2m)
1. **Show Profile & Debt Ledger** (`/student/1`):
   - *"Here is Rahul Sharma. Notice Linked List is SUSPECTED (single slip), but Pointers shows CONFIRMED_DEBT ($P(\text{Debt}) \ge 0.65$ from our ML Gap Predictor)."*
2. **Open System Trace Drawer** (Header Toggle):
   - *"Let me open the live Agent Trace. As Rahul attempts a verification challenge on Pointer Dereferencing, watch the 5-phase agent loop (`Observe` $\rightarrow$ `Reason` $\rightarrow$ `Act` $\rightarrow$ `Verify` $\rightarrow$ `Adapt`)."*
3. **Submit 1st Failing Answer** (e.g., *"Pointers store integers directly in memory"*):
   - *"Rahul submits a incorrect conceptual answer. The LLM evaluates the answer, but notice: **the score (45.0%) is below our shared 80.0 threshold**. The deterministic backend state machine transitions the state from `VERIFYING` to `NEW_INTERVENTION` and triggers **Intervention V2** (Interactive RAM Memory Simulation)."*
4. **Show V2 Adaptation**:
   - *"The agent didn't repeat V1 text. It autonomously adapted pedagogical modality to a visual memory layout diagram."*
5. **Submit 2nd & 3rd Failing Answers**:
   - *"After 3 failed verification attempts, the system escalates the debt to `ESCALATED` status, locking the Mentor Gate until a human mentor reviews the case."*

### 2:30 - 4:00 | User Evidence & Pivot Story (1.5m)
> *"We tested our system with real students. In our early iterations, our Lesson Critic agent was too lenient—letting answer-leaking lesson drafts pass. Based on tester observations documented in `CHANGES-FROM-TESTING.md`, we built an explicit 3-point checklist into `LessonCritic.py` (`targets_misconception`, `no_answer_leak`, `ends_with_checkable`). If a draft fails any point, the critic rejects it and caps revisions at 2 before mentor escalation."*

### 4:00 - 4:30 | Live Break-It Panel Demo (30s)
1. **Click Break-It Button** in top navbar:
   - *"Judges often ask: 'What happens when the LLM outputs malformed JSON or the API returns a rate limit?' Let's test it live."*
2. **Trigger JSON Error / HTTP 429**:
   - *"Watch the real backend execute: `JSONDecodeError` is caught, an explicit `[BREAK-IT INJECTION]` log line is emitted, and the system seamlessly falls back to our local deterministic engine without crashing."*

### 4:30 - 5:00 | Conclusion & Core Principle (30s)
> *"In summary, our core architecture principle is: **LLM proposes. Evidence decides.** Thank you!"*

---

## 2. One-Slide Presentation Text Outline

```text
================================================================================
                    KNOWLEDGE DEBT ENGINE
     Autonomous Student Learning-Gap Tracker & Agentic Remediation
================================================================================

[PROBLEM]
• Students stack persistent conceptual debts; slips are confused with true gaps.

[SOLUTION]
• Multi-Agent Causal DAG Diagnosis (Linked List → Pointer Dereferencing → RAM).
• Autonomous Adaptation: V1 text fails → V2 RAM visual simulation generated.
• Strict Threshold Guard: Shared 80.0% score required to verify debt repayment.

[SAFETY & RELIABILITY]
• Core Guard: "LLM proposes. Evidence decides." (No prompt injection bypass).
• Live OpenRouter Budget Metering ($10.00 cap tracked via key-info endpoint).
• 100% Deterministic Fallback: Resilient to HTTP 402/429 & JSON parse errors.

================================================================================
```

---

## 3. Top 10 Judge Q&A Cheat Sheet

| # | Judge Question | Precise Answer |
|---|---|---|
| **1** | **Which model and API provider are you running?** | We use **Google Gemini 2.0 Flash Lite** accessed through the **OpenRouter API gateway** (`google/gemini-2.0-flash-lite-001`). The UI badge explicitly states `OpenRouter → Gemini 2.0 Flash Lite (REAL)`. |
| **2** | **How do you prevent a student from prompt-injecting to pass?** | All state machine transitions are strictly deterministic. The LLM only proposes a score; the Python backend enforces $Score \ge 80.0$ and checks valid empirical evidence IDs before mutating state. Direct status changes are rejected with `400 Bad Request`. |
| **3** | **What is your pass threshold for debt repayment?** | We use a single shared constant `VERIFICATION_PASS_THRESHOLD = 80.0` defined in `backend/state/state_machine.py` and enforced across all agents and backend routes. |
| **4** | **What happens if OpenRouter hits a 429 rate limit or 402 budget cap?** | `MultiModelEngine` catches HTTP 402/429 status codes, logs `[BREAK-IT INJECTION]` / warning lines, and seamlessly switches to our secondary model or offline local deterministic fallback engine without throwing unhandled exceptions. |
| **5** | **How do you track LLM cost and remaining budget?** | We query OpenRouter's live key-info endpoint (`https://openrouter.ai/api/v1/auth/key`) on each status check. It reports exact dollars spent (`$1.1045`) and dollars remaining (`$8.8955` of `$10.00`). If unavailable, we display `"unknown"`. |
| **6** | **What is the Lesson Critic agent's role?** | Before an intervention lesson is delivered, `LessonCritic` evaluates the draft against a 3-point checklist: (1) targets root misconception, (2) no answer leaking, (3) ends with a checkable practice item. Revisions are capped at 2 before mentor escalation. |
| **7** | **Is V2 generated immediately with V1 or dynamically after failure?** | Dynamically after failure. V2 is generated **only after** a student attempts V1 and fails verification ($score < 80.0$). It incorporates the student's specific failure reasoning into the new strategy. |
| **8** | **Where does the JudgeDemo scene content come from?** | `JudgeDemo.jsx` is a scripted pitch walkthrough labeled `"SCRIPTED WALKTHROUGH, not live"`. The primary live demo runs from the normal application pages (`/student/1`, `/diagnostic`). |
| **9** | **How did real human testing impact your design?** | Early testing showed that text-heavy V1 interventions were ignored. We pivoted to generate interactive RAM memory diagrams in V2 and added a pre-commit hook for API key protection to prevent accidental key leaks. |
| **10**| **What prior code existed before today?** | As disclosed in `PRE-EVENT-ASSETS.md`, prior pre-event commits (`a4f6b88` to `514245e` on 2026-09-19) established the core repository structure, FastAPI endpoints, SQLite database schemas, scikit-learn gap predictor, and React UI layout. |

---
