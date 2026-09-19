"""
Dataset Validation Engine for Knowledge Debt Engine educational content.

Validates:
1. File structure & JSON validity.
2. Unique entity identifiers (Subject, Concept, Question codes).
3. Reference integrity (Concept -> Subject, Prerequisite -> Concept, Question -> Concept/Subject).
4. Prerequisite graph topology (No self-prerequisites, no cycles).
5. Question metadata (valid difficulty 0.0-1.0, valid question_type, MCQ options & answer matching).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class DatasetValidationError(ValueError):
    """Raised when an educational dataset fails validation rules."""


def validate_dataset_dir(data_dir: Path) -> Dict[str, Any]:
    """Validate all JSON dataset files in `data_dir`.

    Expected files:
      - subjects.json
      - concepts.json
      - prerequisites.json
      - questions.json

    Returns a summary dict if valid, or raises DatasetValidationError with detailed errors.
    """
    subjects_file = data_dir / "subjects.json"
    concepts_file = data_dir / "concepts.json"
    prereqs_file = data_dir / "prerequisites.json"
    questions_file = data_dir / "questions.json"

    for file in (subjects_file, concepts_file, prereqs_file, questions_file):
        if not file.exists():
            raise DatasetValidationError(f"Missing required dataset file: {file.name}")

    try:
        subjects = json.loads(subjects_file.read_text(encoding="utf-8"))
        concepts = json.loads(concepts_file.read_text(encoding="utf-8"))
        prereqs = json.loads(prereqs_file.read_text(encoding="utf-8"))
        questions = json.loads(questions_file.read_text(encoding="utf-8"))
    except Exception as exc:
        raise DatasetValidationError(f"JSON syntax error reading dataset files: {exc}") from exc

    errors: List[str] = []

    # 1. Subjects Validation
    subject_codes = set()
    for idx, sub in enumerate(subjects):
        code = sub.get("code")
        if not code:
            errors.append(f"subjects.json[{idx}]: Missing 'code'")
            continue
        if code in subject_codes:
            errors.append(f"subjects.json[{idx}]: Duplicate subject code '{code}'")
        subject_codes.add(code)
        if not sub.get("title"):
            errors.append(f"subjects.json[{idx}]: Missing 'title' for subject '{code}'")

    # 2. Concepts Validation
    concept_codes = set()
    concept_names = set()
    for idx, c in enumerate(concepts):
        code = c.get("code")
        name = c.get("name")
        scode = c.get("subject_code")

        if not code:
            errors.append(f"concepts.json[{idx}]: Missing 'code'")
        elif code in concept_codes:
            errors.append(f"concepts.json[{idx}]: Duplicate concept code '{code}'")
        else:
            concept_codes.add(code)

        if not name:
            errors.append(f"concepts.json[{idx}]: Missing 'name'")
        elif name in concept_names:
            errors.append(f"concepts.json[{idx}]: Duplicate concept name '{name}'")
        else:
            concept_names.add(name)

        if scode and scode not in subject_codes:
            errors.append(f"concepts.json[{idx}]: Unknown subject_code '{scode}' in concept '{code or name}'")

        baseline = c.get("difficulty_baseline")
        if baseline is not None and not (0.0 <= float(baseline) <= 1.0):
            errors.append(f"concepts.json[{idx}]: Baseline difficulty {baseline} out of range [0.0, 1.0]")

    # 3. Prerequisites Validation & Cycle Detection
    adj: Dict[str, List[str]] = {}
    for idx, p in enumerate(prereqs):
        ccode = p.get("concept_code")
        pcode = p.get("prerequisite_concept_code")
        rel_type = p.get("relationship_type", "requires")
        strength = p.get("strength", 1.0)

        if not ccode or ccode not in concept_codes:
            errors.append(f"prerequisites.json[{idx}]: Unknown concept_code '{ccode}'")
        if not pcode or pcode not in concept_codes:
            errors.append(f"prerequisites.json[{idx}]: Unknown prerequisite_concept_code '{pcode}'")
        if ccode and pcode and ccode == pcode:
            errors.append(f"prerequisites.json[{idx}]: Self-prerequisite detected for '{ccode}'")

        if not (0.0 <= float(strength) <= 1.0):
            errors.append(f"prerequisites.json[{idx}]: Strength {strength} out of range [0.0, 1.0]")

        if ccode and pcode:
            adj.setdefault(ccode, []).append(pcode)

    # Cycle Detection using DFS
    visited: Dict[str, int] = {}
    cycles: List[List[str]] = []

    def dfs(node: str, path: List[str]):
        visited[node] = 1
        path.append(node)
        for neighbor in adj.get(node, []):
            if visited.get(neighbor, 0) == 1:
                start_idx = path.index(neighbor)
                cycles.append(path[start_idx:] + [neighbor])
            elif visited.get(neighbor, 0) == 0:
                dfs(neighbor, path)
        path.pop()
        visited[node] = 2

    for cnode in concept_codes:
        if visited.get(cnode, 0) == 0:
            dfs(cnode, [])

    if cycles:
        for cyc in cycles:
            errors.append(f"Prerequisite cycle detected: {' -> '.join(cyc)}")

    # 4. Questions Validation
    valid_types = {
        "MCQ",
        "MULTI_SELECT",
        "TRUE_FALSE",
        "SHORT_ANSWER",
        "SCENARIO",
        "CONCEPTUAL",
        "CODING",
        "TRACE",
        "COMPLEXITY",
        "CODE_READING",
    }
    question_codes = set()

    for idx, q in enumerate(questions):
        qcode = q.get("question_code")
        scode = q.get("subject_code")
        ccode = q.get("concept_code")
        qtype = q.get("question_type")
        diff_score = q.get("difficulty_score")
        diff_label = q.get("difficulty_label")
        text = q.get("question_text")
        answer = q.get("correct_answer")
        explanation = q.get("explanation")
        options = q.get("options")

        if not qcode:
            errors.append(f"questions.json[{idx}]: Missing 'question_code'")
        elif qcode in question_codes:
            errors.append(f"questions.json[{idx}]: Duplicate question_code '{qcode}'")
        else:
            question_codes.add(qcode)

        if not scode or scode not in subject_codes:
            errors.append(f"questions.json[{idx}]: Unknown subject_code '{scode}' in question '{qcode}'")
        if not ccode or ccode not in concept_codes:
            errors.append(f"questions.json[{idx}]: Unknown concept_code '{ccode}' in question '{qcode}'")

        if not qtype or qtype not in valid_types:
            errors.append(f"questions.json[{idx}]: Invalid question_type '{qtype}' in '{qcode}'")

        if diff_score is None or not (0.0 <= float(diff_score) <= 1.0):
            errors.append(f"questions.json[{idx}]: Difficulty score '{diff_score}' out of range [0.0, 1.0]")

        if not text:
            errors.append(f"questions.json[{idx}]: Missing 'question_text' in '{qcode}'")
        if answer is None:
            errors.append(f"questions.json[{idx}]: Missing 'correct_answer' in '{qcode}'")
        if not explanation:
            errors.append(f"questions.json[{idx}]: Missing 'explanation' in '{qcode}'")

        # MCQ Option check
        if qtype in ("MCQ", "MULTI_SELECT", "TRUE_FALSE"):
            if not options or not isinstance(options, list) or len(options) < 2:
                errors.append(f"questions.json[{idx}]: Question '{qcode}' of type '{qtype}' must have at least 2 options")
            elif isinstance(answer, str) and answer not in options and qtype == "MCQ":
                errors.append(f"questions.json[{idx}]: Correct answer '{answer}' not found in options for '{qcode}'")

    if errors:
        msg = f"Dataset validation failed with {len(errors)} error(s):\n" + "\n".join(f" - {e}" for e in errors)
        raise DatasetValidationError(msg)

    return {
        "status": "VALID",
        "subjects_count": len(subjects),
        "concepts_count": len(concepts),
        "prerequisites_count": len(prereqs),
        "questions_count": len(questions),
    }


def main():
    root_dir = Path(__file__).resolve().parents[2]
    data_root = root_dir / "data"
    subdirs = [d for d in data_root.iterdir() if d.is_dir() and (d / "subjects.json").exists()]

    if not subdirs:
        print(f"No dataset directories found in {data_root}")
        sys.exit(1)

    all_passed = True
    for data_dir in sorted(subdirs):
        print(f"\nValidating educational dataset at {data_dir}...")
        try:
            summary = validate_dataset_dir(data_dir)
            print(f"  Dataset '{data_dir.name}' Validation PASSED!")
            print(f"    Subjects:      {summary['subjects_count']}")
            print(f"    Concepts:      {summary['concepts_count']}")
            print(f"    Prerequisites: {summary['prerequisites_count']}")
            print(f"    Questions:     {summary['questions_count']}")
        except DatasetValidationError as exc:
            print(f"\nVALIDATION FAILED for '{data_dir.name}':\n{exc}")
            all_passed = False

    if not all_passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
