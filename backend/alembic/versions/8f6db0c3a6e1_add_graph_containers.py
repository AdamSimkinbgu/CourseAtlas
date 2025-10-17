"""add graph containers metadata

Revision ID: 8f6db0c3a6e1
Revises: ce2f9d0a2b27
Create Date: 2025-02-16 02:25:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8f6db0c3a6e1"
down_revision: Union[str, None] = "ce2f9d0a2b27"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "graphs",
        sa.Column(
            "containers",
            sa.JSON(),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
    )
    op.add_column(
        "graphs",
        sa.Column(
            "container_assignments",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("graphs", "container_assignments")
    op.drop_column("graphs", "containers")
