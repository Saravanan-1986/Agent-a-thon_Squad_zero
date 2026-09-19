# Knowledge Debt Engine - Dataset & Importer Guide

This guide explains how to format, validate, and seed real educational datasets into the **Knowledge Debt Engine**.

---

## 1. Directory Structure

Educational datasets are stored as versioned JSON files under `data/<subject_code>/`.
For the first production subject (DBMS), the structure is:

```
data/
└── dbms/
    ├── subjects.json       # Subject domain metadata
    ├── concepts.json       # Concept hierarchy & baseline difficulty
    ├── prerequisites.json  # Concept dependency graph
    └── questions.json      # Question bank with rich metadata
```

---

## 2. Dataset Formats

### A. Subject Format (`subjects.json`)
```json
[
  {
    "code": "DBMS",
    "title": "Database Management Systems",
    "description": "Study of relational database theory, normalization, transactions, SQL, and indexing."
  }
]
```

### B. Concept Format (`concepts.json`)
```json
[
  {
    "code": "DBMS-NORM-3NF",
    "subject_code": "DBMS",
    "name": "3NF",
    "category": "Normalization",
    "description": "Third Normal Form requiring elimination of transitive dependencies.",
    "difficulty_baseline": 0.70
  }
]
```

### C. Prerequisite Format (`prerequisites.json`)
```json
[
  {
    "concept_code": "DBMS-NORM-3NF",
    "prerequisite_concept_code": "DBMS-NORM-2NF",
    "relationship_type": "requires",
    "strength": 1.0
  }
]
```

### D. Question Format (`questions.json`)
```json
[
  {
    "question_code": "Q-DBMS-NORM-003",
    "subject_code": "DBMS",
    "concept_code": "DBMS-NORM-3NF",
    "difficulty_label": "hard",
    "difficulty_score": 0.78,
    "question_type": "SCENARIO",
    "question_text": "Relation Employee(EmpID, DeptID, DeptHeader) has Primary Key EmpID...",
    "options": [
      "Option A...",
      "Option B..."
    ],
    "correct_answer": "Option B...",
    "explanation": "Detailed step-by-step solution explaining why Option B is correct...",
    "skill_tags": ["3NF", "Transitive Dependency"],
    "estimated_time_seconds": 90,
    "source_reference": "Database System Concepts, 7th Edition - Chapter 7",
    "status": "active"
  }
]
```

---

## 3. Question Quality & Difficulty Standard

Every question must adhere to the following standards:
1. **Targeted Testing**: Tests a specific concept rather than general trivia.
2. **Clear Expected Answer**: `correct_answer` must be explicit and unambiguous.
3. **Pedagogical Explanation**: `explanation` must explain *why* the answer is correct and why common distractors fail.
4. **Difficulty Scoring**:
   - **Easy (0.0 to 0.35)**: Basic recall, terminology, direct query syntax.
   - **Medium (0.36 to 0.65)**: Multi-step reasoning, scenario identification, standard queries.
   - **Hard (0.66 to 1.00)**: Complex decomposition, BCNF/3NF edge cases, serializability precedence graph analysis.
5. **Supported Question Types**:
   - `MCQ`
   - `MULTI_SELECT`
   - `TRUE_FALSE`
   - `SHORT_ANSWER`
   - `SCENARIO`
   - `CONCEPTUAL`
   - `CODING`

---

## 4. Dataset Validation Engine

Run the dataset validator to check for syntax errors, missing fields, broken references, or dependency graph cycles:

```bash
python -m database.validators.dataset_validator
```

### Validation Rules Enforced:
- All referenced subject and concept codes must exist.
- No duplicate subject, concept, or question codes.
- No self-prerequisites (concept requiring itself).
- No directed cycles in the prerequisite dependency graph.
- All MCQ/TRUE_FALSE questions must have options and correct_answer present in options.

---

## 5. Educational Seed Importer

Import the validated dataset into the active database (PostgreSQL or SQLite):

```bash
# Idempotent seed (upserts without creating duplicates or fake students)
python -m database.seed.import_dbms

# Re-create database schema and seed afresh
python -m database.seed.import_dbms --fresh
```

> [!NOTE]
> The seed importer imports **ONLY** educational domain content (Subjects, Concepts, Prerequisites, Questions). **Zero permanent fake student records** are created.
