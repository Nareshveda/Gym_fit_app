"""add half_yearly duration type

Revision ID: 8f4a2c19d6e3
Revises: 533a41703ddc
Create Date: 2026-08-31 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '8f4a2c19d6e3'
down_revision: Union[str, Sequence[str], None] = '533a41703ddc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Postgres 12+ allows ADD VALUE inside a transaction as long as the new
    # value isn't used in the same transaction (it isn't, here).
    op.execute("ALTER TYPE duration_type ADD VALUE IF NOT EXISTS 'half_yearly'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no ALTER TYPE ... DROP VALUE — removing an enum value
    # requires rebuilding the type (and touching every column that uses it).
    # Not worth it for a downgrade path that's unlikely to ever run; any rows
    # already using 'half_yearly' would block it anyway.
    pass
