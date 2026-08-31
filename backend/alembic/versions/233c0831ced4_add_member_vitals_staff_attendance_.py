"""add member vitals, staff attendance, and member category/whatsapp/medical/goal fields

Revision ID: 233c0831ced4
Revises: 7b0b5a8c49fa
Create Date: 2026-08-30 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '233c0831ced4'
down_revision: Union[str, Sequence[str], None] = '7b0b5a8c49fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('members', sa.Column('whatsapp_number', sa.String(length=30), nullable=True))
    op.add_column('members', sa.Column('medical_history', sa.String(length=2000), nullable=True))
    op.add_column('members', sa.Column('goal', sa.String(length=255), nullable=True))

    # ADD COLUMN (unlike CREATE TABLE) does not implicitly create the enum
    # type on Postgres, so it must be created explicitly first.
    training_category_enum = sa.Enum('personal_training', 'group_training', name='training_category')
    training_category_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'members',
        sa.Column(
            'training_category',
            training_category_enum,
            nullable=False,
            server_default='group_training',
        ),
    )
    op.alter_column('members', 'training_category', server_default=None)
    op.create_index(op.f('ix_members_training_category'), 'members', ['training_category'], unique=False)

    op.create_table(
        'member_vitals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('recorded_at', sa.Date(), nullable=False),
        sa.Column('height_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('weight_kg', sa.Numeric(precision=5, scale=1), nullable=False),
        sa.Column('bmi', sa.Numeric(precision=4, scale=1), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('recorded_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_member_vitals_id'), 'member_vitals', ['id'], unique=False)
    op.create_index(op.f('ix_member_vitals_member_id'), 'member_vitals', ['member_id'], unique=False)
    op.create_index(op.f('ix_member_vitals_recorded_at'), 'member_vitals', ['recorded_at'], unique=False)
    op.create_index(op.f('ix_member_vitals_recorded_by'), 'member_vitals', ['recorded_by'], unique=False)

    op.create_table(
        'staff_attendances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('staff_id', sa.Integer(), nullable=False),
        sa.Column('check_in_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('check_out_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['staff_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_staff_attendances_date'), 'staff_attendances', ['date'], unique=False)
    op.create_index(op.f('ix_staff_attendances_id'), 'staff_attendances', ['id'], unique=False)
    op.create_index(op.f('ix_staff_attendances_staff_id'), 'staff_attendances', ['staff_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_staff_attendances_staff_id'), table_name='staff_attendances')
    op.drop_index(op.f('ix_staff_attendances_id'), table_name='staff_attendances')
    op.drop_index(op.f('ix_staff_attendances_date'), table_name='staff_attendances')
    op.drop_table('staff_attendances')

    op.drop_index(op.f('ix_member_vitals_recorded_by'), table_name='member_vitals')
    op.drop_index(op.f('ix_member_vitals_recorded_at'), table_name='member_vitals')
    op.drop_index(op.f('ix_member_vitals_member_id'), table_name='member_vitals')
    op.drop_index(op.f('ix_member_vitals_id'), table_name='member_vitals')
    op.drop_table('member_vitals')

    op.drop_index(op.f('ix_members_training_category'), table_name='members')
    op.drop_column('members', 'training_category')
    op.drop_column('members', 'goal')
    op.drop_column('members', 'medical_history')
    op.drop_column('members', 'whatsapp_number')

    sa.Enum(name='training_category').drop(op.get_bind(), checkfirst=True)
