"""Add users.auth_source / users.is_blocked, drop the unused analytics_questions table.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0002'
down_revision: Union[str, Sequence[str], None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Plain ADD COLUMN (no batch table rebuild): SQLite supports it natively, and rebuilding `users`
    # would fail on SQLite while other tables still reference it with foreign keys enabled.
    op.add_column('users', sa.Column('auth_source', sa.String(), nullable=False, server_default='eios'))
    op.add_column('users', sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default=sa.false()))

    # The env-configured administrator was the only account created outside EIOS (by /admin-login),
    # always with these exact values. Mark it so it can never be reached through EIOS login.
    op.execute(
        "UPDATE users SET auth_source = 'local' "
        "WHERE full_name = 'Администратор ИВИТШ КГУ' AND group_number = 'Деканат ИВИТШ' AND role = 'admin'"
    )

    op.drop_index(op.f('ix_analytics_questions_question_text'), table_name='analytics_questions')
    op.drop_index(op.f('ix_analytics_questions_id'), table_name='analytics_questions')
    op.drop_table('analytics_questions')


def downgrade() -> None:
    op.create_table('analytics_questions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('question_text', sa.String(), nullable=False),
    sa.Column('ask_count', sa.Integer(), nullable=True),
    sa.Column('last_asked', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_questions_id'), 'analytics_questions', ['id'], unique=False)
    op.create_index(op.f('ix_analytics_questions_question_text'), 'analytics_questions', ['question_text'], unique=True)

    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('is_blocked')
        batch_op.drop_column('auth_source')
