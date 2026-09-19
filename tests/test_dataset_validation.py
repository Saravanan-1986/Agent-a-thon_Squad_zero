"""
Unit tests for dataset validator and educational seed importer.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from database.seed.import_dbms import import_dbms_dataset
from database.validators.dataset_validator import (
    DatasetValidationError,
    validate_dataset_dir,
)


def test_real_dbms_dataset_validation():
    root_dir = Path(__file__).resolve().parents[1]
    data_dir = root_dir / "data" / "dbms"
    summary = validate_dataset_dir(data_dir)

    assert summary["status"] == "VALID"
    assert summary["subjects_count"] >= 1
    assert summary["concepts_count"] >= 30
    assert summary["prerequisites_count"] >= 10
    assert summary["questions_count"] >= 30


def test_invalid_dataset_directory(tmp_path):
    # Missing files should trigger error
    with pytest.raises(DatasetValidationError, match="Missing required dataset file"):
        validate_dataset_dir(tmp_path)


def test_importer_idempotency():
    root_dir = Path(__file__).resolve().parents[1]
    data_dir = root_dir / "data" / "dbms"

    # First import
    res1 = import_dbms_dataset(data_dir, fresh=False)
    assert res1["subjects_imported"] >= 1
    assert res1["concepts_imported"] >= 30

    # Second import (idempotent)
    res2 = import_dbms_dataset(data_dir, fresh=False)
    assert res2["subjects_imported"] == res1["subjects_imported"]
    assert res2["concepts_imported"] == res1["concepts_imported"]
    assert res2["questions_imported"] == res1["questions_imported"]
