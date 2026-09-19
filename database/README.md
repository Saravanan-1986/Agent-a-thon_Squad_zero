# Knowledge Debt Engine — Database + Persistence Layer (Member 2)

Scope of this folder (branch `member2-memory-tests`): **`database/` + `tests/` only.**
Nothing in `backend/`, `frontend/` or root files is touched — Member 1 and
Member 3 own those.

## Integration with the backend (`database/compat.py`)

Member 3's backend was written against an in-memory fallback
(`backend/services/mock_repository.py`). `database/compat.py` exposes that
same interface on top of the durable SQLAlchemy layer, so the whole app
persists to the real database without the agents knowing anything changed:

* the API runtime uses `database.compat` by default;
* set `KNOWLEDGE_DEBT_USE_MOCK=true` to force the in-memory store
  (`backend/tests/conftest.py` does this so Member 3's suite stays
  deterministic);
* `NEW_INTERVENTION` from the agents is stored as the canonical
  `INTERVENTION_PROPOSED`;
* multi-hop jumps (e.g. `INTERVENTION_PROPOSED → IN_INTERVENTION`) are walked
  legally through `MENTOR_REVIEW`; the gated targets (`REPAID`, `REGRESSED`,
  `ESCALATED`) are direct-edge only and keep their evidence/retry gates;
* the orchestrator persists every verification/regression outcome as real
  evidence rows, so the evidence gates are genuinely enforced in production.

## Module map

| File | Responsibility |
|---|---|
| `connection.py` | SQLAlchemy engine + session factory. SQLite by default, Postgres via `DATABASE_URL`. `get_db()` is the FastAPI-style dependency. |
| `models.py` | ORM models + lifecycle enums: `students`, `concepts`, `prerequisites`, `evidence`, `debts`, `interventions`, `mentor_reviews`, `events` (append-only audit log). |
| `state_machine.py` | The ONLY legal transition map (`VALID_TRANSITIONS`), `RETRY_LIMIT`, and the rule exceptions. |
| `repository.py` | The only DB access layer. Returns plain, JSON-ready dicts. Enforces all engine rules. |
| `compat.py` | Backend-facing adapter with the exact interface `backend/` imports (embedded `interventions`, int versions, numeric severity, `get_debt_by_id`, `get_events_for_debt`, `get_prerequisites`, `get_pending_interventions`). |
| `seed.py` | Demo data: 7 concepts with the Programming Basics → Arrays → Pointers → Linked Lists → Trees prerequisite chain, 3 students, and the canonical "42% / FAIL / 45% → CONFIRMED_DEBT" evidence pattern. |
| `migrations/` | Alembic environment + initial schema migration. |


## Wiring snippet for Member 3 (`backend/main.py`)

```python
from fastapi import Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from database import repository

@app.get("/students/{student_id}")
def read_student(student_id: int, db: Session = Depends(get_db)):
    return repository.get_student(student_id, session=db)  # or session=None
```

Every repository function accepts an optional `session`:
`None` → a short-lived session is opened/committed/closed internally;
given → the caller owns the transaction (recommended inside request handlers).


## Install / migrate / seed / test

```bash
pip install sqlalchemy alembic pytest      # fastapi/pydantic live in requirements.txt (Members 1+3)

# create/migrate the schema (target = DATABASE_URL env var, else local SQLite)
alembic -c database/alembic.ini upgrade head
alembic -c database/alembic.ini downgrade base          # undo everything

# seed demo data (idempotent; --fresh drops and recreates)
python -m database.seed
python -m database.seed --fresh

# run the full test suite (in-memory SQLite only — never touches your dev DB)
python -m pytest tests/ -q
```

## Wiring snippet for Member 3 (`backend/main.py`)

```python
from fastapi import Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from database import repository

@app.get("/students/{student_id}")
def read_student(student_id: int, db: Session = Depends(get_db)):
    return repository.get_student(student_id, session=db)  # or session=None
```

Every repository function accepts an optional `session`:
`None` → a short-lived session is opened/committed/closed internally;
given → the caller owns the transaction (recommended inside request handlers).


## Repository API contract (agree shapes with Member 3)

All functions return **plain dicts**; timestamps are ISO-8601 strings (naive
UTC); enums are plain strings (`status="CONFIRMED_DEBT"`, `source="quiz"`,
`severity="HIGH"`).

| Function | Returns |
|---|---|
| `create_student(external_id, name)` | `{"id", "external_id", "name", "created_at"}` |
| `get_student(student_id=None, external_id=None)` | student dict or `None` |
| `add_evidence(student_id, concept_id, source, score, passed, timestamp=None)` | evidence dict — **never touches debts** |
| `get_evidence_history(student_id, concept_id)` | list of evidence dicts, oldest first |
| `get_or_create_debt(student_id, concept_id, initial_status="CLEAR")` | debt dict (birth states: CLEAR or SUSPECTED only) |
| `get_debt(debt_id)` | debt dict or `None` |
| `update_debt_status(debt_id, new_status, evidence_id=None)` | updated debt dict; raises on any rule violation |
| `update_debt_severity(debt_id, severity)` | updated debt dict |
| `record_intervention(debt_id, version, content)` | intervention dict; bumps `attempts`; `version=None` auto-computes `Vn+1` |
| `record_mentor_review(intervention_id, decision, edited_content=None, mentor_id=None)` | review dict; mirrors `intervention.mentor_status`; does NOT move the debt state |
| `log_event(student_id, event_type, payload, debt_id=None)` | event dict |
| `get_debt_ledger(student_id)` | list of debt dicts (+ `concept_name`) — the ledger view |
| `get_interventions(debt_id)` | list, oldest first (full V1/V2/... history) |
| `get_mentor_reviews(intervention_id)` | list |
| `get_events(student_id, debt_id=None, event_type=None)` | list, oldest first (audit trail) |
| `detect_and_confirm_debt(student_id, concept_id, ...)` | debt dict or `None` — **stub** of the Evidence Agent's threshold logic (real one lives in `backend/agents/`) |
| `resolve_post_failure(debt_id)` | debt dict — ESCALATED at the retry limit, else INTERVENTION_PROPOSED |

Exceptions (all subclass `ValueError`, see `state_machine.py`):
`KnowledgeDebtError`, `DebtNotFoundError`, `InvalidStateTransitionError`,
`DebtVerificationError`, `RetryLimitExceededError`.

## The rules the repository enforces ("LLM proposes. Evidence decides.")

1. **State machine**: every `update_debt_status` call is validated against
   `VALID_TRANSITIONS`. Anything else (e.g. `CLEAR → REPAID`) raises
   `InvalidStateTransitionError`.
2. **No fake mastery**: `VERIFYING → REPAID` requires `evidence_id` of an
   evidence row that (a) belongs to the same student+concept, (b) passed,
   and (c) is fresh (taken after the latest intervention). Otherwise:
   `DebtVerificationError` — "Knowledge Debt can only be repaid after valid
   verification evidence."
3. **No fake regression**: `REPAID → REGRESSED` requires attached FAILING
   evidence for the same pair.
4. **Retry limit** (`RETRY_LIMIT = 3` in `state_machine.py`): after 3 failed
   interventions, `FAILED → INTERVENTION_PROPOSED` raises
   `RetryLimitExceededError` and `resolve_post_failure` routes the debt to
   `ESCALATED` (terminal until a human intervenes).
5. **Audit**: every successful transition appends an `events` row
   (`DEBT_STATUS_TRANSITION` with from/to/evidence_id). Events are append-only.
6. **Single mistake ≠ debt**: `add_evidence` never creates a debt; only the
   detection step (`detect_and_confirm_debt`, >=2 weak records by default) does.

Lifecycle:

```
CLEAR → SUSPECTED → CONFIRMED_DEBT → INTERVENTION_PROPOSED → MENTOR_REVIEW
      → IN_INTERVENTION → FOLLOW_UP → VERIFYING → REPAID
        VERIFYING → FAILED → (INTERVENTION_PROPOSED | ESCALATED)
        REPAID → REGRESSED → CONFIRMED_DEBT      # new cycle, same debt row
```


## Test suite (`tests/`)

Fresh in-memory SQLite per test (function-scoped fixture); `DATABASE_URL` is
deliberately bypassed by rebinding `repository.session_factory`.

| File | Covers |
|---|---|
| `test_students.py` | student CRUD, duplicate external_id rejected |
| `test_evidence.py` | evidence recording/history; **single evidence does NOT create debt** |
| `test_debt_detection.py` | weak evidence pattern → CONFIRMED_DEBT (+severity), idempotency |
| `test_state_machine.py` | every valid edge (parametrized from the map) + every dangerous invalid edge |
| `test_persistence.py` | data survives across sessions; caller-owned sessions; audit log |
| `test_backward_loop.py` | V1 fails → V2 (new strategy) → REPAID; REPAID → REGRESSED → new cycle; mentor edit history |
| `test_retry_limit.py` | 3 failures → auto-ESCALATED; escalation impossible early; ESCALATED is terminal |
| `test_adversarial.py` | "mark me repaid" rejected; stale/borrowed/failed evidence rejected; LLM-invented transitions rejected |

## Notes for the team

* `detect_and_confirm_debt` is a deterministic **stub** (min 2 records,
  avg < 60 → confirmed; HIGH below 45, else MEDIUM). Member 3's
  `evidence_agent.py` should call the repository primitives instead of
  replacing the DB logic.
* One debt row per (student, concept). `REGRESSED` re-opens the SAME row so
  `attempts`, interventions and events stay one continuous history.
* All timestamps are naive UTC (SQLite does not round-trip tzinfo).
* Postgres: set `DATABASE_URL=postgresql://user:pass@host:5432/kde` before
  running alembic/seed; `postgres://` URLs are rewritten automatically.
* A mentor "edit" stores the edited strategy on `mentor_reviews.edited_content`
  while `interventions.content` keeps the AI's original — both are history.


