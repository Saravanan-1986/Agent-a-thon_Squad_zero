"""
Seed the Knowledge Debt Engine database.

Creates:
  * 7 concepts with a realistic prerequisite chain:
        Programming Basics → Arrays → Pointers → Linked Lists → Trees
    plus "Memory and Dereferencing" → Pointers and Arrays → Hash Tables
  * 3 test students (S001, S002, S003)
  * Evidence showing the canonical CONFIRMED-DEBT pattern from the spec:
        Pointers quiz 42% FAIL / coding FAIL / follow-up 45% FAIL
        → Pointers: CONFIRMED_DEBT, severity HIGH
    plus healthy controls, and the "single mistake is NOT debt" control.

Usage (from the repository root):
    python -m database.seed              # seed DATABASE_URL (default ./knowledge_debt.db)
    python -m database.seed --fresh      # drop everything and reseed
    python database/seed.py              # same as the -m form
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

if __package__ in (None, ""):  # allow `python database/seed.py`
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import repository
from database.connection import init_db

CONCEPTS = [
    ("Programming Basics", "Variables, loops, functions, basic I/O."),
    ("Arrays", "Indexing, iteration, common array patterns."),
    ("Memory and Dereferencing", "Stack vs heap, addresses, dereferencing values."),
    ("Pointers", "Pointer arithmetic, dereferencing, pass-by-reference."),
    ("Linked Lists", "Node traversal, insertion, deletion."),
    ("Trees", "Binary trees, traversal orders, recursion on nodes."),
    ("Hash Tables", "Hashing, collisions, buckets."),
]

# concept → list of concepts that must be mastered first
PREREQUISITES = {
    "Arrays": ["Programming Basics"],
    "Memory and Dereferencing": ["Programming Basics"],
    "Pointers": ["Arrays", "Memory and Dereferencing"],
    "Linked Lists": ["Pointers"],
    "Trees": ["Linked Lists"],
    "Hash Tables": ["Arrays"],
}


def _hours_ago(hours: float) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=hours)


def seed(fresh: bool = False) -> None:
    if fresh:
        from database import connection, models

        engine = connection.get_engine()
        models.Base.metadata.drop_all(engine)

    init_db()

    # Idempotency marker: S001 only exists if we already seeded.
    if repository.get_student(external_id="S001") is not None:
        print("Already seeded (student S001 exists). Use --fresh to reseed.")
        return

    # --- concepts + prerequisite graph -------------------------------------
    concept_ids = {}
    for name, description in CONCEPTS:
        concept = repository.get_or_create_concept(name, description)
        concept_ids[name] = concept["id"]
    for concept_name, prereqs in PREREQUISITES.items():
        for prereq in prereqs:
            repository.add_prerequisite(concept_ids[concept_name], concept_ids[prereq])

    # --- students -----------------------------------------------------------
    priya = repository.create_student("S001", "Priya Sharma")
    marcus = repository.create_student("S002", "Marcus Chen")
    elena = repository.create_student("S003", "Elena Petrova")

    arrays = concept_ids["Arrays"]
    pointers = concept_ids["Pointers"]
    linked_lists = concept_ids["Linked Lists"]

    # --- S001: healthy on Arrays, CONFIRMED_DEBT on Pointers ----------------
    repository.add_evidence(priya["id"], arrays, "quiz", 88.0, True, timestamp=_hours_ago(24 * 14))
    repository.add_evidence(priya["id"], arrays, "coding", 92.0, True, timestamp=_hours_ago(24 * 12))

    # The canonical pattern from the spec: 42% / coding FAIL / 45%
    repository.add_evidence(priya["id"], pointers, "quiz", 42.0, False, timestamp=_hours_ago(24 * 10))
    repository.add_evidence(priya["id"], pointers, "coding", 30.0, False, timestamp=_hours_ago(24 * 8))
    repository.add_evidence(priya["id"], pointers, "follow_up", 45.0, False, timestamp=_hours_ago(24 * 6))

    # Observed weakness one level up the graph (Linked Lists) — only ONE weak
    # signal so far, so it stays SUSPECTED and is not confirmed.
    repository.add_evidence(priya["id"], linked_lists, "quiz", 48.0, False, timestamp=_hours_ago(24 * 4))

    repository.detect_and_confirm_debt(priya["id"], pointers)  # → CONFIRMED_DEBT / HIGH
    ll_debt = repository.get_or_create_debt(priya["id"], linked_lists)
    repository.update_debt_status(ll_debt["id"], "SUSPECTED")

    # --- S002: strong everywhere → a clean ledger ---------------------------
    for concept_id in (arrays, pointers):
        repository.add_evidence(marcus["id"], concept_id, "quiz", 85.0, True, timestamp=_hours_ago(24 * 5))
        repository.add_evidence(marcus["id"], concept_id, "coding", 90.0, True, timestamp=_hours_ago(24 * 4))

    # --- S003: exactly ONE failed quiz → must NOT create a debt --------------
    repository.add_evidence(elena["id"], arrays, "quiz", 35.0, False, timestamp=_hours_ago(24 * 3))

    # --- summary --------------------------------------------------------------
    print("Seeded successfully.\n")
    for student in (priya, marcus, elena):
        print(f"{student['external_id']} — {student['name']}")
        ledger = repository.get_debt_ledger(student["id"])
        if not ledger:
            print("  (clean ledger — no debts)")
        for entry in ledger:
            print(
                f"  {entry['concept_name']:<26} status={entry['status']:<18} "
                f"severity={str(entry['severity']):<6} attempts={entry['attempts']} "
                f"failed={entry['failed_interventions']}"
            )
        print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Knowledge Debt Engine database")
    parser.add_argument("--fresh", action="store_true", help="drop all tables and reseed")
    args = parser.parse_args()
    seed(fresh=args.fresh)


if __name__ == "__main__":
    main()
