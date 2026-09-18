"""add contacted flag to leads

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-18 01:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: str | Sequence[str] | None = 'a1b2c3d4e5f6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'leads',
        sa.Column('contacted', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('leads', 'contacted')
