"""Baseline: the schema that Base.metadata.create_all() produced before migrations were introduced.

Existing databases are stamped with this revision automatically (see app/db/migrate.py).

Revision ID: 0001
Revises:
Create Date: 2026-09-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('analytics_questions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('question_text', sa.String(), nullable=False),
    sa.Column('ask_count', sa.Integer(), nullable=True),
    sa.Column('last_asked', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_questions_id'), 'analytics_questions', ['id'], unique=False)
    op.create_index(op.f('ix_analytics_questions_question_text'), 'analytics_questions', ['question_text'], unique=True)
    op.create_table('announcements',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('is_important', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_announcements_id'), 'announcements', ['id'], unique=False)
    op.create_table('faq_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('question', sa.String(), nullable=False),
    sa.Column('answer', sa.Text(), nullable=False),
    sa.Column('category', sa.String(), nullable=True),
    sa.Column('order_index', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faq_items_id'), 'faq_items', ['id'], unique=False)
    op.create_table('revoked_tokens',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('jti', sa.String(), nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_revoked_tokens_id'), 'revoked_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_revoked_tokens_jti'), 'revoked_tokens', ['jti'], unique=True)
    op.create_table('subjects',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('subject_code', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('short_name', sa.String(), nullable=False),
    sa.Column('emoji', sa.String(), nullable=True),
    sa.Column('color', sa.String(), nullable=True),
    sa.Column('difficulty', sa.Integer(), nullable=True),
    sa.Column('hours', sa.Integer(), nullable=True),
    sa.Column('credits', sa.Integer(), nullable=True),
    sa.Column('semester', sa.Integer(), nullable=True),
    sa.Column('control_type', sa.String(), nullable=True),
    sa.Column('extra_type', sa.String(), nullable=True),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('mascot_hack', sa.Text(), nullable=True),
    sa.Column('senior_advice', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subjects_id'), 'subjects', ['id'], unique=False)
    op.create_index(op.f('ix_subjects_subject_code'), 'subjects', ['subject_code'], unique=True)
    op.create_table('teachers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('department', sa.String(), nullable=False),
    sa.Column('role', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=True),
    sa.Column('office', sa.String(), nullable=True),
    sa.Column('hours', sa.String(), nullable=True),
    sa.Column('courses', sa.String(), nullable=True),
    sa.Column('photo_url', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_teachers_id'), 'teachers', ['id'], unique=False)
    op.create_index(op.f('ix_teachers_name'), 'teachers', ['name'], unique=False)
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=True),
    sa.Column('full_name', sa.String(), nullable=False),
    sa.Column('hashed_password', sa.String(), nullable=False),
    sa.Column('role', sa.String(), nullable=True),
    sa.Column('group_number', sa.String(), nullable=True),
    sa.Column('sdo_id', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_table('forum_questions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('category', sa.String(), nullable=True),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('views_count', sa.Integer(), nullable=True),
    sa.Column('is_pinned', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_forum_questions_id'), 'forum_questions', ['id'], unique=False)
    op.create_index(op.f('ix_forum_questions_title'), 'forum_questions', ['title'], unique=False)
    op.create_table('user_adaptations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('completed_steps', sa.String(), nullable=True),
    sa.Column('last_updated', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_adaptations_id'), 'user_adaptations', ['id'], unique=False)
    op.create_table('forum_answers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('question_id', sa.Integer(), nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('is_solution', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['question_id'], ['forum_questions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_forum_answers_id'), 'forum_answers', ['id'], unique=False)
    op.create_table('votes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('question_id', sa.Integer(), nullable=False),
    sa.Column('vote_type', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['question_id'], ['forum_questions.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'question_id', name='uq_vote_user_question')
    )
    op.create_index(op.f('ix_votes_id'), 'votes', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_votes_id'), table_name='votes')
    op.drop_table('votes')
    op.drop_index(op.f('ix_forum_answers_id'), table_name='forum_answers')
    op.drop_table('forum_answers')
    op.drop_index(op.f('ix_user_adaptations_id'), table_name='user_adaptations')
    op.drop_table('user_adaptations')
    op.drop_index(op.f('ix_forum_questions_title'), table_name='forum_questions')
    op.drop_index(op.f('ix_forum_questions_id'), table_name='forum_questions')
    op.drop_table('forum_questions')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_teachers_name'), table_name='teachers')
    op.drop_index(op.f('ix_teachers_id'), table_name='teachers')
    op.drop_table('teachers')
    op.drop_index(op.f('ix_subjects_subject_code'), table_name='subjects')
    op.drop_index(op.f('ix_subjects_id'), table_name='subjects')
    op.drop_table('subjects')
    op.drop_index(op.f('ix_revoked_tokens_jti'), table_name='revoked_tokens')
    op.drop_index(op.f('ix_revoked_tokens_id'), table_name='revoked_tokens')
    op.drop_table('revoked_tokens')
    op.drop_index(op.f('ix_faq_items_id'), table_name='faq_items')
    op.drop_table('faq_items')
    op.drop_index(op.f('ix_announcements_id'), table_name='announcements')
    op.drop_table('announcements')
    op.drop_index(op.f('ix_analytics_questions_question_text'), table_name='analytics_questions')
    op.drop_index(op.f('ix_analytics_questions_id'), table_name='analytics_questions')
    op.drop_table('analytics_questions')
