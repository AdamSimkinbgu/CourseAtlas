"""add auth provider id to users

Revision ID: ce2f9d0a2b27
Revises: 24f65274b9a1
Create Date: 2025-01-15 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ce2f9d0a2b27"
down_revision: Union[str, None] = "24f65274b9a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column("auth_provider_id", sa.String(length=255), nullable=True)
        )
        batch.create_unique_constraint(
            "uq_users_auth_provider_id",
            ["auth_provider_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_constraint("uq_users_auth_provider_id", type_="unique")
        batch.drop_column("auth_provider_id")
