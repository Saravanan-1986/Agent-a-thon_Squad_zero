"""
Idempotent Educational Content Importer for DSA (Data Structures & Algorithms).

Usage:
  python -m database.seed.import_dsa
  python -m database.seed.import_dsa --fresh
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from database import repository
from database.connection import init_db
from database.validators.dataset_validator import validate_dataset_dir


def import_dsa_dataset(data_dir: Path, fresh: bool = False) -> dict:
    """Validate and idempotently seed DSA educational content into the database."""
    print(f"1. Validating dataset in {data_dir}...")
    validation_summary = validate_dataset_dir(data_dir)
    print("   Validation successful.")

    if fresh:
        from database import connection, models

        print("2. Re-creating database schema (--fresh requested)...")
        engine = connection.get_engine()
        models.Base.metadata.drop_all(engine)

    print("3. Initializing database tables...")
    init_db()

    subjects_data = json.loads((data_dir / "subjects.json").read_text(encoding="utf-8"))
    concepts_data = json.loads((data_dir / "concepts.json").read_text(encoding="utf-8"))
    prereqs_data = json.loads((data_dir / "prerequisites.json").read_text(encoding="utf-8"))
    questions_data = json.loads((data_dir / "questions.json").read_text(encoding="utf-8"))

    # 1. Import Subjects
    subject_map = {}  # code -> id
    for sub in subjects_data:
        res = repository.create_subject(
            code=sub["code"], title=sub["title"], description=sub.get("description")
        )
        subject_map[sub["code"]] = res["id"]

    # 2. Import Concepts
    concept_map = {}  # code -> id
    for c in concepts_data:
        sub_id = subject_map.get(c.get("subject_code"))
        res = repository.get_or_create_concept(
            name=c["name"],
            description=c.get("description"),
            code=c.get("code"),
            category=c.get("category"),
            difficulty_baseline=c.get("difficulty_baseline", 0.5),
            subject_id=sub_id,
        )
        concept_map[c["code"]] = res["id"]
        concept_map[c["name"]] = res["id"]

    # 3. Import Prerequisites
    prereq_count = 0
    for p in prereqs_data:
        cid = concept_map.get(p["concept_code"])
        pid = concept_map.get(p["prerequisite_concept_code"])
        if cid and pid:
            repository.add_prerequisite(
                concept_id=cid,
                prerequisite_concept_id=pid,
                relationship_type=p.get("relationship_type", "requires"),
                strength=float(p.get("strength", 1.0)),
            )
            prereq_count += 1

    # 4. Import Questions
    question_count = 0
    for q in questions_data:
        sub_id = subject_map.get(q["subject_code"])
        cid = concept_map.get(q["concept_code"])
        if sub_id and cid:
            repository.create_question(
                question_code=q["question_code"],
                subject_id=sub_id,
                concept_id=cid,
                difficulty_label=q["difficulty_label"],
                difficulty_score=q["difficulty_score"],
                question_type=q["question_type"],
                question_text=q["question_text"],
                correct_answer=q["correct_answer"],
                explanation=q["explanation"],
                options=q.get("options"),
                skill_tags=q.get("skill_tags"),
                estimated_time_seconds=q.get("estimated_time_seconds", 60),
                source_reference=q.get("source_reference"),
            )
            question_count += 1

    summary = {
        "subjects_imported": len(subjects_data),
        "concepts_imported": len(concepts_data),
        "prerequisites_imported": prereq_count,
        "questions_imported": question_count,
    }
    return summary


def main():
    parser = argparse.ArgumentParser(description="Seed Educational DSA Dataset into Database")
    parser.add_argument("--fresh", action="store_true", help="Drop and recreate database tables")
    args = parser.parse_args()

    root_dir = Path(__file__).resolve().parents[2]
    data_dir = root_dir / "data" / "dsa"

    print("=== DSA Educational Content Importer ===")
    summary = import_dsa_dataset(data_dir, fresh=args.fresh)
    print("\nImport Summary:")
    print(f"  Subjects:      {summary['subjects_imported']}")
    print(f"  Concepts:      {summary['concepts_imported']}")
    print(f"  Prerequisites: {summary['prerequisites_imported']}")
    print(f"  Questions:     {summary['questions_imported']}")
    print("Database seeding completed successfully without creating fake students.")


if __name__ == "__main__":
    main()
