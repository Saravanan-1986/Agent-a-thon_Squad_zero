"""
Script: reset_demo.py

Resets student state and created demo debts back to clean seed state.
Preserves subject domain definitions, concept graphs, and question banks intact.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import delete
from database.connection import get_session_factory
from database.models import Event, MentorReview, Intervention, Evidence, StudentResponse, AssessmentAttempt, Debt, Student

def reset_demo():
    print("=" * 70)
    print(" KNOWLEDGE DEBT ENGINE — RESETTING DEMO STATE")
    print("=" * 70)

    session = get_session_factory()()
    try:
        # Find demo students by external_id
        demo_students = session.query(Student).filter(Student.external_id.in_(["demo_student", "rahul_demo", "student_1"])).all()
        if demo_students:
            for demo_student in demo_students:
                sid = demo_student.id
                print(f"[1/3] Found Demo Student ID={sid} ({demo_student.name}). Cleaning user records...")

                # Clean dependent tables for student
                session.execute(delete(Event).where(Event.student_id == sid))
                session.execute(delete(Evidence).where(Evidence.student_id == sid))
                session.execute(delete(StudentResponse).where(StudentResponse.student_id == sid))
                session.execute(delete(AssessmentAttempt).where(AssessmentAttempt.student_id == sid))

                # Clean interventions & debts
                debt_ids = [d.id for d in session.query(Debt).filter(Debt.student_id == sid).all()]
                if debt_ids:
                    interventions = session.query(Intervention).filter(Intervention.debt_id.in_(debt_ids)).all()
                    int_ids = [i.id for i in interventions]
                    if int_ids:
                        session.execute(delete(MentorReview).where(MentorReview.intervention_id.in_(int_ids)))
                        session.execute(delete(Intervention).where(Intervention.id.in_(int_ids)))
                    session.execute(delete(Debt).where(Debt.id.in_(debt_ids)))

                session.execute(delete(Student).where(Student.id == sid))
            session.commit()
            print("[2/3] Demo student activity, debts, evidence, and events purged successfully.")
        else:
            print("[1/3] No existing demo student record found. State is already clean.")

        print("[3/3] Base subject definitions, concept graphs, and question banks preserved.")
        print("=" * 70)
        print(" DEMO RESET COMPLETE")
        print("=" * 70)
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Reset failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    reset_demo()
