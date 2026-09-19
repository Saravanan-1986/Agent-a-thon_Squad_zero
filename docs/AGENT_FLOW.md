# Multi-Agent Execution Flow & Observability

## Lifecycle & Agent Interaction Architecture

```mermaid
graph TD
    A[Student Diagnostic Submission] --> B[Scikit-Learn ML Predictor]
    B --> C{Deterministic Decision Engine}
    C -- Gap Prob >= 0.65 & Score < 60% --> D[State: CONFIRMED_DEBT]
    D --> E[Root Cause Diagnosis Agent]
    E --> F[Adaptive LLM Intervention Agent]
    F --> G[State: INTERVENTION_PROPOSED]
    G --> H[Mentor Review / Auto-Approve]
    H --> I[State: IN_INTERVENTION]
    I --> J[Fresh Verification Challenge]
    J --> K{Evidence Verification Gate}
    K -- Pass (100%) --> L[State: REPAID]
    K -- Fail (< 100%) --> M[State: FAILED]
    M -- Retries < 3 --> N[Generate V2/V3 Strategy]
    M -- Retries >= 3 --> O[State: ESCALATED]
```

## Agent Roles
1. **Evidence Agent:** Processes raw student responses and converts score signals into evidence rows.
2. **ML Predictor:** Evaluates 8 concept features to calculate knowledge gap probability.
3. **Deterministic Decision Engine:** Enforces state transition topology and retry limit boundaries.
4. **Diagnosis Agent:** Traverses the prerequisite graph to identify root-cause dependency weaknesses.
5. **Intervention Agent:** Generates multi-version ($V_1, V_2, V_3$) pedagogical strategies based on past database memory.
6. **Verification Gate:** Requires fresh passing evidence before allowing transition to `REPAID`.

## Live System Observability
- Event audit log (`Event` table in SQLite DB).
- REST Endpoint: `/api/system/trace/{student_id}`.
- UI Observability Panel (`SystemTraceDrawer.jsx`): Displays color-coded live event logs with auto-refresh polling.
