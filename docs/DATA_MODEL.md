# Knowledge Debt Engine - Data Model & Schema Documentation

The **Knowledge Debt Engine** database architecture provides a persistent, audit-logged educational foundation. The core principle governing the engine is:

> **"LLM PROPOSES. DETERMINISTIC CODE DECIDES."**

---

## 1. High-Level Entity Relationship Topology

```
Subject
  │
  ├── Concept
  │     ├── Prerequisite (Self-referencing Graph: Concept → Concept)
  │     └── Question (Item Bank)
  │
  └── Assessment
        └── AssessmentQuestion ── Question

Student
  │
  ├── AssessmentAttempt (takes Assessment)
  │     └── StudentResponse (granular answer per Question & Concept)
  │
  ├── Evidence (observed performance signals: Quiz, Coding, Follow-up, LeetCode)
  │
  └── Debt (persistent tracked knowledge gap per student/concept)
        │
        ├── Intervention (V1, V2, ... remediation strategy)
        │     └── MentorReview (Approve / Edit / Reject)
        │
        └── Event (Append-only audit log of state transitions)
```

---

## 2. Detailed Core Entities

### Student (`students`)
Represents an individual student taking diagnostic assessments and remediating knowledge debts.
- `id` (Integer, Primary Key)
- `external_id` (String(64), Unique, Indexed): Natural identifier (e.g. `S001`).
- `name` (String(120), Required): Student's full name.
- `created_at` (DateTime, UTC): Profile creation timestamp.

---

### Subject (`subjects`)
Represents a major educational subject domain (e.g., Database Management Systems).
- `id` (Integer, Primary Key)
- `code` (String(32), Unique, Indexed): Subject code (e.g. `DBMS`).
- `title` (String(120), Required): Full course title.
- `description` (String(500), Optional): Subject description.
- `created_at` (DateTime, UTC): Record creation timestamp.

---

### Concept (`concepts`)
A discrete, testable unit of knowledge within a subject domain.
- `id` (Integer, Primary Key)
- `subject_id` (Integer, Foreign Key → `subjects.id`): Domain subject reference.
- `code` (String(64), Unique, Indexed): Concept code (e.g. `DBMS-NORM-3NF`).
- `name` (String(120), Unique, Indexed): Human-readable name (e.g. `3NF`).
- `category` (String(64), Indexed): Hierarchy group (e.g. `Normalization`).
- `description` (String(500), Optional): Detailed concept summary.
- `difficulty_baseline` (Float, Default 0.5): Estimated baseline difficulty (0.0 to 1.0).

---

### Prerequisite (`prerequisites`)
Self-referencing directed dependency relationship table between concepts.
- `concept_id` (Integer, Foreign Key → `concepts.id`, Primary Key): Target concept requiring prerequisite.
- `prerequisite_concept_id` (Integer, Foreign Key → `concepts.id`, Primary Key): Upstream required concept.
- `relationship_type` (String(32), Default "requires"): Dependency type (`requires` or `recommended`).
- `strength` (Float, Default 1.0): Dependency weight (0.0 to 1.0).
- `created_at` (DateTime, UTC): Relationship timestamp.

---

### Question (`questions`)
Rich pedagogical item-bank question schema supporting adaptive assessment and ML feature extraction.
- `id` (Integer, Primary Key)
- `question_code` (String(64), Unique, Indexed): Item code (e.g. `Q-DBMS-NORM-001`).
- `subject_id` (Integer, Foreign Key → `subjects.id`): Subject reference.
- `concept_id` (Integer, Foreign Key → `concepts.id`): Primary concept tested.
- `difficulty_label` (String(16)): Difficulty category (`easy`, `medium`, `hard`).
- `difficulty_score` (Float): Numerical difficulty value (0.0 to 1.0).
- `question_type` (Enum): `MCQ`, `MULTI_SELECT`, `TRUE_FALSE`, `SHORT_ANSWER`, `SCENARIO`, `CONCEPTUAL`, `CODING`.
- `question_text` (String(2000)): The question body.
- `options` (JSON, Optional): List of options for choice questions.
- `correct_answer` (JSON): Expected correct answer representation.
- `explanation` (String(2000)): Detailed step-by-step solution.
- `skill_tags` (JSON): Array of skill strings.
- `estimated_time_seconds` (Integer, Default 60): Expected completion time.
- `source_reference` (String(256), Optional): Academic or textbook citation.
- `version` (Integer, Default 1): Item version counter.
- `status` (String(16), Default "active"): Item status (`active` or `deprecated`).

---

### Assessment (`assessments`) & Junction (`assessment_questions`)
Blueprint for diagnostic or practice test sequences.
- `id` (Integer, Primary Key)
- `subject_id` (Integer, Foreign Key → `subjects.id`)
- `title` (String(120))
- `type` (String(32), Default "diagnostic"): `diagnostic`, `practice`, or `verification`.
- `total_questions` (Integer): Count of questions in assessment sequence.

`assessment_questions` maps `(assessment_id, question_id)` with `sequence_order`.

---

### AssessmentAttempt (`assessment_attempts`) & StudentResponse (`student_responses`)
Granular raw evidence recording student responses for future ML model training.
- **AssessmentAttempt**: Tracks overall attempt session state (`in_progress`, `completed`, `total_score`).
- **StudentResponse**: Preserves exact atomic evidence:
  - `attempt_id`, `student_id`, `question_id`, `concept_id`
  - `selected_answer`, `is_correct`, `score` (0-100)
  - `response_time_seconds`, `attempt_number`
  - `question_difficulty`, `question_type`
  - `timestamp`

---

### Knowledge Debt (`debts`)
Persistent ledger row tracking unresolved learning gaps per `(student_id, concept_id)` pair.
- `id` (Integer, Primary Key)
- `student_id` (Integer, Foreign Key → `students.id`)
- `concept_id` (Integer, Foreign Key → `concepts.id`)
- `status` (Enum): Controlled by 12-state deterministic state machine:
  - `CLEAR` → `SUSPECTED` → `CONFIRMED_DEBT` → `INTERVENTION_PROPOSED` → `MENTOR_REVIEW` → `IN_INTERVENTION` → `FOLLOW_UP` → `VERIFYING` → `REPAID` | `FAILED`
  - `FAILED` → `INTERVENTION_PROPOSED` (if < 3 attempts) | `ESCALATED` (if >= 3 attempts)
  - `REPAID` → `REGRESSED` → `CONFIRMED_DEBT`
- `severity` (Enum, Optional): `LOW`, `MEDIUM`, `HIGH`.
- `confidence` (Float, Default 0.5): Estimated probability of knowledge gap.
- `attempts` (Integer): Count of remediation interventions recorded.
- `failed_interventions` (Integer): Count of failed verification attempts.
- `verification_attempt_count` (Integer)
- `regression_count` (Integer)

---

### Event (`events`)
Append-only audit log of every state transition and system action.
- `id` (Integer, Primary Key)
- `student_id` (Integer, Foreign Key → `students.id`)
- `debt_id` (Integer, Foreign Key → `debts.id`, Optional)
- `event_type` (String(64)): e.g. `DEBT_STATUS_TRANSITION`, `EVIDENCE_RECORDED`.
- `payload` (JSON): Context metadata.
- `timestamp` (DateTime, UTC): Immutable audit timestamp.
