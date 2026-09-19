"""add educational domain tables

Revision ID: b67e89012345
Revises: 9efe46230780
Create Date: 2026-09-19 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b67e89012345'
down_revision: Union[str, Sequence[str], None] = '9efe46230780'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create subjects table
    op.create_table(
        'subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('subjects', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_subjects_code'), ['code'], unique=True)

    # 2. Add new columns to concepts table
    with op.batch_alter_table('concepts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('subject_id', sa.Integer(), sa.ForeignKey('subjects.id'), nullable=True))
        batch_op.add_column(sa.Column('code', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('category', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('difficulty_baseline', sa.Float(), nullable=True, server_default='0.5'))
        batch_op.create_index(batch_op.f('ix_concepts_code'), ['code'], unique=True)
        batch_op.create_index(batch_op.f('ix_concepts_category'), ['category'], unique=False)

    # 3. Add new columns to prerequisites table
    with op.batch_alter_table('prerequisites', schema=None) as batch_op:
        batch_op.add_column(sa.Column('relationship_type', sa.String(length=32), nullable=False, server_default='requires'))
        batch_op.add_column(sa.Column('strength', sa.Float(), nullable=False, server_default='1.0'))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))

    # 4. Create questions table
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_code', sa.String(length=64), nullable=False),
        sa.Column('subject_id', sa.Integer(), sa.ForeignKey('subjects.id'), nullable=False),
        sa.Column('concept_id', sa.Integer(), sa.ForeignKey('concepts.id'), nullable=False),
        sa.Column('difficulty_label', sa.String(length=16), nullable=False),
        sa.Column('difficulty_score', sa.Float(), nullable=False),
        sa.Column('question_type', sa.String(length=32), nullable=False),
        sa.Column('question_text', sa.String(length=2000), nullable=False),
        sa.Column('options', sa.JSON(), nullable=True),
        sa.Column('correct_answer', sa.JSON(), nullable=False),
        sa.Column('explanation', sa.String(length=2000), nullable=False),
        sa.Column('skill_tags', sa.JSON(), nullable=True),
        sa.Column('estimated_time_seconds', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('source_reference', sa.String(length=256), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('questions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_questions_question_code'), ['question_code'], unique=True)
        batch_op.create_index('ix_questions_concept_difficulty', ['concept_id', 'difficulty_score'], unique=False)

    # 5. Create assessments table
    op.create_table(
        'assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), sa.ForeignKey('subjects.id'), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('type', sa.String(length=32), nullable=False, server_default='diagnostic'),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Create assessment_questions junction table
    op.create_table(
        'assessment_questions',
        sa.Column('assessment_id', sa.Integer(), sa.ForeignKey('assessments.id'), nullable=False),
        sa.Column('question_id', sa.Integer(), sa.ForeignKey('questions.id'), nullable=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False, server_default='1'),
        sa.PrimaryKeyConstraint('assessment_id', 'question_id')
    )

    # 7. Create assessment_attempts table
    op.create_table(
        'assessment_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id'), nullable=False),
        sa.Column('assessment_id', sa.Integer(), sa.ForeignKey('assessments.id'), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='in_progress'),
        sa.Column('total_score', sa.Float(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('assessment_attempts', schema=None) as batch_op:
        batch_op.create_index('ix_assessment_attempts_student', ['student_id'], unique=False)

    # 8. Create student_responses table
    op.create_table(
        'student_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), sa.ForeignKey('assessment_attempts.id'), nullable=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id'), nullable=False),
        sa.Column('question_id', sa.Integer(), sa.ForeignKey('questions.id'), nullable=True),
        sa.Column('concept_id', sa.Integer(), sa.ForeignKey('concepts.id'), nullable=False),
        sa.Column('selected_answer', sa.JSON(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('response_time_seconds', sa.Float(), nullable=True),
        sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('question_difficulty', sa.Float(), nullable=True),
        sa.Column('question_type', sa.String(length=32), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('student_responses', schema=None) as batch_op:
        batch_op.create_index('ix_student_responses_student_concept', ['student_id', 'concept_id'], unique=False)

    # 9. Extend evidence table with granular fields
    with op.batch_alter_table('evidence', schema=None) as batch_op:
        batch_op.add_column(sa.Column('attempt_id', sa.Integer(), sa.ForeignKey('assessment_attempts.id'), nullable=True))
        batch_op.add_column(sa.Column('question_id', sa.Integer(), sa.ForeignKey('questions.id'), nullable=True))
        batch_op.add_column(sa.Column('response_time_seconds', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'))
        batch_op.add_column(sa.Column('question_difficulty', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('question_type', sa.String(length=32), nullable=True))

    # 10. Extend debts table with confidence and timestamps
    with op.batch_alter_table('debts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('confidence', sa.Float(), nullable=False, server_default='0.5'))
        batch_op.add_column(sa.Column('verification_attempt_count', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('regression_count', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('first_detected_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('last_evidence_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('debts', schema=None) as batch_op:
        batch_op.drop_column('last_evidence_at')
        batch_op.drop_column('first_detected_at')
        batch_op.drop_column('regression_count')
        batch_op.drop_column('verification_attempt_count')
        batch_op.drop_column('confidence')

    with op.batch_alter_table('evidence', schema=None) as batch_op:
        batch_op.drop_column('question_type')
        batch_op.drop_column('question_difficulty')
        batch_op.drop_column('attempt_number')
        batch_op.drop_column('response_time_seconds')
        batch_op.drop_column('question_id')
        batch_op.drop_column('attempt_id')

    with op.batch_alter_table('student_responses', schema=None) as batch_op:
        batch_op.drop_index('ix_student_responses_student_concept')
    op.drop_table('student_responses')

    with op.batch_alter_table('assessment_attempts', schema=None) as batch_op:
        batch_op.drop_index('ix_assessment_attempts_student')
    op.drop_table('assessment_attempts')

    op.drop_table('assessment_questions')
    op.drop_table('assessments')

    with op.batch_alter_table('questions', schema=None) as batch_op:
        batch_op.drop_index('ix_questions_concept_difficulty')
        batch_op.drop_index(batch_op.f('ix_questions_question_code'))
    op.drop_table('questions')

    with op.batch_alter_table('prerequisites', schema=None) as batch_op:
        batch_op.drop_column('created_at')
        batch_op.drop_column('strength')
        batch_op.drop_column('relationship_type')

    with op.batch_alter_table('concepts', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_concepts_category'))
        batch_op.drop_index(batch_op.f('ix_concepts_code'))
        batch_op.drop_column('difficulty_baseline')
        batch_op.drop_column('category')
        batch_op.drop_column('code')
        batch_op.drop_column('subject_id')

    with op.batch_alter_table('subjects', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_subjects_code'))
    op.drop_table('subjects')
