"""add member codes, birth month/year (replacing date_of_birth), user phone, upi + payment reference number

Revision ID: 22623c6e2aea
Revises: 233c0831ced4
Create Date: 2026-08-31 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22623c6e2aea'
down_revision: Union[str, Sequence[str], None] = '233c0831ced4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    # --- users.phone (additive, nullable) -----------------------------------
    op.add_column('users', sa.Column('phone', sa.String(length=30), nullable=True))

    # --- payments: UPI method + reference_number ----------------------------
    op.add_column('payments', sa.Column('reference_number', sa.String(length=100), nullable=True))
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'upi'")

    # --- members.birth_month / birth_year, replacing date_of_birth ----------
    op.add_column('members', sa.Column('birth_month', sa.Integer(), nullable=True))
    op.add_column('members', sa.Column('birth_year', sa.Integer(), nullable=True))
    op.execute(
        "UPDATE members SET birth_month = EXTRACT(MONTH FROM date_of_birth), "
        "birth_year = EXTRACT(YEAR FROM date_of_birth)"
    )
    op.alter_column('members', 'birth_month', nullable=False)
    op.alter_column('members', 'birth_year', nullable=False)
    op.drop_column('members', 'date_of_birth')

    # --- members.member_code (permanent, category-prefixed, sequential) -----
    op.add_column('members', sa.Column('member_code', sa.String(length=16), nullable=True))
    prefixes = {'personal_training': 'PT', 'group_training': 'GT'}
    for category, prefix in prefixes.items():
        rows = bind.execute(
            sa.text("SELECT id FROM members WHERE training_category = :category ORDER BY id"),
            {"category": category},
        ).fetchall()
        for index, row in enumerate(rows, start=1):
            bind.execute(
                sa.text("UPDATE members SET member_code = :code WHERE id = :id"),
                {"code": f"{prefix}-{index:04d}", "id": row.id},
            )
    op.alter_column('members', 'member_code', nullable=False)
    op.create_index(op.f('ix_members_member_code'), 'members', ['member_code'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()

    op.drop_index(op.f('ix_members_member_code'), table_name='members')
    op.drop_column('members', 'member_code')

    op.add_column('members', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.execute(
        "UPDATE members SET date_of_birth = make_date(birth_year, birth_month, 1)"
    )
    op.alter_column('members', 'date_of_birth', nullable=False)
    op.drop_column('members', 'birth_year')
    op.drop_column('members', 'birth_month')

    # Postgres can't drop a single enum value in place; rebuild the type
    # without 'upi', downgrading any 'upi' rows to 'other' first.
    bind.execute(sa.text("UPDATE payments SET payment_method = 'other' WHERE payment_method = 'upi'"))
    op.execute("ALTER TYPE payment_method RENAME TO payment_method_old")
    op.execute("CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'other')")
    op.execute(
        "ALTER TABLE payments ALTER COLUMN payment_method TYPE payment_method "
        "USING payment_method::text::payment_method"
    )
    op.execute("DROP TYPE payment_method_old")
    op.drop_column('payments', 'reference_number')

    op.drop_column('users', 'phone')
