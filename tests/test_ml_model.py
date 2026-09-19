"""
Unit tests for Scikit-Learn ML Model Feature Extractor & Predictor Pipeline.
"""

import pytest
from database import repository
from ml.feature_extractor import extract_student_concept_features
from ml.predictor import predict_knowledge_gap

@pytest.fixture
def sample_student_and_concept(session_factory):
    # Set up session factory override for tests
    repository.session_factory = session_factory
    student = repository.create_student(external_id="test_ml_student", name="ML Test Student")
    subject = repository.create_subject(code="DSA_ML", title="DSA ML Test")
    concept = repository.create_concept(
        code="ML-CON-001",
        subject_id=subject["id"],
        name="Test ML Concept",
        category="Test"
    )
    yield student, concept
    repository.session_factory = None

def test_feature_extractor_empty_history(sample_student_and_concept):
    student, concept = sample_student_and_concept
    features = extract_student_concept_features(student["id"], concept["id"])
    assert features["attempt_count"] == 0
    assert features["accuracy"] == 0.5  # Neutral default
    assert features["failure_count"] == 0

def test_feature_extractor_with_evidence(sample_student_and_concept):
    student, concept = sample_student_and_concept
    sid = student["id"]
    cid = concept["id"]

    # Record 3 evidence items: 2 failed, 1 passed
    repository.add_evidence(sid, cid, "quiz", score=20.0, passed=False)
    repository.add_evidence(sid, cid, "quiz", score=40.0, passed=False)
    repository.add_evidence(sid, cid, "quiz", score=80.0, passed=True)

    features = extract_student_concept_features(sid, cid)
    assert features["attempt_count"] == 3
    assert features["failure_count"] == 2
    assert 0.0 <= features["accuracy"] <= 1.0

def test_ml_predictor_inference(sample_student_and_concept):
    student, concept = sample_student_and_concept
    features = {
        "accuracy": 0.25,
        "recent_accuracy": 0.20,
        "attempt_count": 4,
        "failure_count": 3,
        "avg_response_time": 45.0,
        "difficulty_adjusted_accuracy": 0.20,
        "recent_trend": -0.20,
        "prerequisite_performance": 0.40,
    }

    res = predict_knowledge_gap(concept["id"], features)
    assert "knowledge_gap_probability" in res
    assert 0.0 <= res["knowledge_gap_probability"] <= 1.0
    assert res["knowledge_gap_probability"] >= 0.5  # High risk expected for low accuracy
