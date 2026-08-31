"""add locations, equipment/inventory, member referral fields, staff/member location assignment

Revision ID: 5311a4ba805e
Revises: 22623c6e2aea
Create Date: 2026-08-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5311a4ba805e'
down_revision: Union[str, Sequence[str], None] = '22623c6e2aea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'locations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index(op.f('ix_locations_id'), 'locations', ['id'], unique=False)

    op.create_table(
        'equipment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('brand', sa.String(length=150), nullable=True),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('warranty_details', sa.String(length=500), nullable=True),
        sa.Column('service_schedule', sa.String(length=500), nullable=True),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_equipment_id'), 'equipment', ['id'], unique=False)
    op.create_index(op.f('ix_equipment_name'), 'equipment', ['name'], unique=False)

    op.create_table(
        'equipment_locations',
        sa.Column('equipment_id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('equipment_id', 'location_id'),
    )

    op.add_column('users', sa.Column('location_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_users_location_id'), 'users', ['location_id'], unique=False)
    op.create_foreign_key(
        'fk_users_location_id', 'users', 'locations', ['location_id'], ['id'], ondelete='SET NULL'
    )

    op.add_column('members', sa.Column('location_id', sa.Integer(), nullable=True))
    op.add_column('members', sa.Column('referred_by_name', sa.String(length=150), nullable=True))
    op.add_column('members', sa.Column('referred_by_member_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_members_location_id'), 'members', ['location_id'], unique=False)
    op.create_index(op.f('ix_members_referred_by_member_id'), 'members', ['referred_by_member_id'], unique=False)
    op.create_foreign_key(
        'fk_members_location_id', 'members', 'locations', ['location_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_members_referred_by_member_id', 'members', 'members', ['referred_by_member_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_members_referred_by_member_id', 'members', type_='foreignkey')
    op.drop_constraint('fk_members_location_id', 'members', type_='foreignkey')
    op.drop_index(op.f('ix_members_referred_by_member_id'), table_name='members')
    op.drop_index(op.f('ix_members_location_id'), table_name='members')
    op.drop_column('members', 'referred_by_member_id')
    op.drop_column('members', 'referred_by_name')
    op.drop_column('members', 'location_id')

    op.drop_constraint('fk_users_location_id', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_location_id'), table_name='users')
    op.drop_column('users', 'location_id')

    op.drop_table('equipment_locations')
    op.drop_index(op.f('ix_equipment_name'), table_name='equipment')
    op.drop_index(op.f('ix_equipment_id'), table_name='equipment')
    op.drop_table('equipment')

    op.drop_index(op.f('ix_locations_id'), table_name='locations')
    op.drop_table('locations')
