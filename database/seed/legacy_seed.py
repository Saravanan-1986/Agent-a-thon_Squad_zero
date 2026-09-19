"""
Legacy seed script for local test data.
Note: For production educational content, use database.seed.import_dbms.
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

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

    if repository.get_student(external_id="S001") is not None:
        print("Already seeded (student S001 exists). Use --fresh to reseed.")
        return

    concept_ids = {}
    for name, description in CONCEPTS:
        concept = repository.get_or_create_concept(name, description)
        concept_ids[name] = concept["id"]
    for concept_name, prereqs in PREREQUISITES.items():
        for prereq in prereqs:
            repository.add_prerequisite(concept_ids[concept_name], concept_ids[prereq])

    priya = repository.create_student("S001", "Priya Sharma")
    marcus = repository.create_student("S002", "Marcus Chen")
    elena = repository.create_student("S003", "Elena Petrova")

    arrays = concept_ids["Arrays"]
    pointers = concept_ids["Pointers"]
    linked_lists = concept_ids["Linked Lists"]

    repository.add_evidence(priya["id"], arrays, "quiz", 88.0, True, timestamp=_hours_ago(24 * 14))
    repository.add_evidence(priya["id"], arrays, "coding", 92.0, True, timestamp=_hours_ago(24 * 12))

    repository.add_evidence(priya["id"], pointers, "quiz", 42.0, False, timestamp=_hours_ago(24 * 10))
    repository.add_evidence(priya["id"], pointers, "coding", 30.0, False, timestamp=_hours_ago(24 * 8))
    repository.add_evidence(priya["id"], pointers, "follow_up", 45.0, False, timestamp=_hours_ago(24 * 6))

    repository.add_evidence(priya["id"], linked_lists, "quiz", 48.0, False, timestamp=_hours_ago(24 * 4))

    repository.detect_and_confirm_debt(priya["id"], pointers)
    ll_debt = repository.get_or_create_debt(priya["id"], linked_lists)
    repository.update_debt_status(ll_debt["id"], "SUSPECTED")

    for concept_id in (arrays, pointers):
        repository.add_evidence(marcus["id"], concept_id, "quiz", 85.0, True, timestamp=_hours_ago(24 * 5))
        repository.add_evidence(marcus["id"], concept_id, "coding", 90.0, True, timestamp=_hours_ago(24 * 4))

    repository.add_evidence(elena["id"], arrays, "quiz", 35.0, False, timestamp=_hours_ago(24 * 3))

    print("Legacy seeded successfully.\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Knowledge Debt Engine database (Legacy)")
    parser.add_argument("--fresh", action="store_true", help="drop all tables and reseed")
    args = parser.parse_args()
    seed(fresh=args.fresh)


if __name__ == "__main__":
    main()
