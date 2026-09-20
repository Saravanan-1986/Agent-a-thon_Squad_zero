# Assumptions & Key Hypotheses Log

This document tracks team hypotheses formed during system design, how they were tested, empirical results, and architectural decisions made when assumptions turned out wrong.

---

| Assumption | How We Tested It | Empirical Result & Method | Decision / Pivot |
| :--- | :--- | :--- | :--- |
| **1. Text-Only Explanations**<br>*Assumption: Passive text explanations (V1) are sufficient to repair deep pointer memory gaps.* | Tested V1 text explanations against transfer verification challenges. | `[Evaluation Method: Automated Test]` Automated verification scoring rejected passive text responses lacking interactive RAM address trace. | **Pivot**: Built Strategy Evolution ($V_1 \rightarrow V_2$). When V1 fails, system automatically pivots to step-by-step RAM address simulations and interactive code debugging. |
| **2. Self-Reported Repayment**<br>*Assumption: Students can accurately judge when they have repaired a concept.* | Tested self-report claims against backend evidence validation. | `[Evaluation Method: Automated Test]` Self-reported repayment attempts failed state machine transition validation without evidence score $\ge 0.80$. | **Hard Rule**: Enforced *"LLM proposes. Evidence decides."* State transition to `REPAID` can ONLY be earned via an empirical score $\ge 0.80$ calculated by backend code. |
| **3. Unlimited Draft Revisions**<br>*Assumption: LLM intervention generators can refine drafts indefinitely until perfect.* | Ran uncapped draft revision loops against Lesson Critic checklist. | `[Evaluation Method: Automated Test]` Uncapped loops increased latency and consumed API budget without guarantees of convergence. | **Hard Rule**: Capped critic draft revisions to max 2 loops per attempt. If unresolvable, system deterministically escalates to `MENTOR_ESCALATED` state. |
| **4. Direct API Provider Trust**<br>*Assumption: Primary LLM API model strings remain permanently static on external gateways.* | Tested `google/gemini-2.0-flash-lite-001` via OpenRouter endpoint. | `[Evaluation Method: Automated Test]` OpenRouter updated model identifiers, returning HTTP 404 for deprecated model strings. | **Architecture**: Mapped `SLICE_FALLBACK_MODEL` in `.env` to `google/gemini-2.5-flash-lite` with automatic fallback to local deterministic templates. |
