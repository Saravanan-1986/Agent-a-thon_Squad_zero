"""The most important loops of the engine:

1. VERIFYING → FAILED → NEW STRATEGY (V2) → VERIFYING → REPAID
   — failure must change the strategy, and the version history must survive.
2. REPAID → REGRESSED → CONFIRMED_DEBT — a repaid concept that degrades
   re-enters the cycle as a new debt on the same row (history preserved).
"""

from database import repository

from tests.helpers import drive_to, failing_evidence, fresh_passing_evidence


def test_failed_verification_generates_v2_and_then_repays(ids):
    did = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V1", {"style": "explanation + MCQs", "questions": 5})
    drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")

    # --- V1 fails verification ---------------------------------------------
    repository.update_debt_status(did, "FAILED")
    debt = repository.get_debt(did)
    assert debt["status"] == "FAILED"
    assert debt["failed_interventions"] == 1
    assert debt["attempts"] == 1

    # --- the failure changes the strategy (V2), it does not repeat V1 ------
    repository.update_debt_status(did, "INTERVENTION_PROPOSED")
    repository.record_intervention(
        did, "V2", {"style": "memory diagrams + code tracing + debugging", "questions": 4}
    )
    drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")

    # --- V2 passes on fresh evidence ----------------------------------------
    debt = repository.update_debt_status(
        did, "REPAID", evidence_id=fresh_passing_evidence(ids["student_id"], ids["pointers_id"])
    )
    assert debt["status"] == "REPAID"
    assert debt["attempts"] == 2
    assert debt["failed_interventions"] == 1

    # --- full version history is preserved ----------------------------------
    versions = repository.get_interventions(did)
    assert [i["version"] for i in versions] == ["V1", "V2"]
    assert versions[0]["content"]["style"] == "explanation + MCQs"
    assert versions[1]["content"]["style"].startswith("memory diagrams")
    assert versions[0]["content"] != versions[1]["content"]


def test_mentor_edit_becomes_part_of_the_history(ids):
    did = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    intervention = repository.record_intervention(did, "V1", {"style": "explanation + MCQs"})
    drive_to(did, "MENTOR_REVIEW")

    review = repository.record_mentor_review(
        intervention["id"],
        "edited",
        edited_content={"style": "memory visualization + code tracing + debugging exercises"},
        mentor_id="M001",
    )
    assert review["decision"] == "edited"
    assert review["mentor_id"] == "M001"

    stored = repository.get_interventions(did)[0]
    assert stored["mentor_status"] == "edited"
    # the mentor's edit is stored on the review, the AI's original stays intact
    assert repository.get_mentor_reviews(intervention["id"])[0]["edited_content"][
        "style"
    ].startswith("memory visualization")
    assert stored["content"]["style"] == "explanation + MCQs"


def test_repaid_concept_regresses_and_reenters_the_cycle(ids):
    did = repository.get_or_create_debt(ids["student_id"], ids["pointers_id"])["id"]
    drive_to(did, "SUSPECTED", "CONFIRMED_DEBT", "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V1", {"style": "explanation + MCQs"})
    drive_to(did, "MENTOR_REVIEW", "IN_INTERVENTION", "FOLLOW_UP", "VERIFYING")
    repository.update_debt_status(
        did, "REPAID", evidence_id=fresh_passing_evidence(ids["student_id"], ids["pointers_id"])
    )

    # --- a later transfer assessment fails → REGRESSED (needs evidence) -----
    debt = repository.update_debt_status(
        did, "REGRESSED", evidence_id=failing_evidence(ids["student_id"], ids["pointers_id"])
    )
    assert debt["status"] == "REGRESSED"

    # --- it re-enters the cycle as a new debt on the SAME row ---------------
    repository.update_debt_status(did, "CONFIRMED_DEBT")
    repository.update_debt_status(did, "INTERVENTION_PROPOSED")
    repository.record_intervention(did, "V2", {"style": "debugging exercises"})

    debt = repository.get_debt(did)
    assert debt["status"] == "INTERVENTION_PROPOSED"
    assert debt["attempts"] == 2  # cumulative across both debt cycles

    # history from BOTH cycles lives on the same debt row
    assert [i["version"] for i in repository.get_interventions(did)] == ["V1", "V2"]

    ledger = repository.get_debt_ledger(ids["student_id"])
    assert ledger[0]["concept_name"] == "Pointers"
    assert ledger[0]["status"] == "INTERVENTION_PROPOSED"
