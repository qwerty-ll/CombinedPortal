"""Add users.pd_consent_at / pd_consent_version: when a student agreed to personal data processing.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('pd_consent_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('pd_consent_version', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('pd_consent_version')
        batch_op.drop_column('pd_consent_at')
