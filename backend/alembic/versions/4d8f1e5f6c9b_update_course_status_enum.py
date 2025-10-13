"""update course status enum

Revision ID: 4d8f1e5f6c9b
Revises: 8f6db0c3a6e1
Create Date: 2025-02-16 07:45:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4d8f1e5f6c9b"
down_revision: Union[str, None] = "8f6db0c3a6e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("ALTER TYPE course_status RENAME TO course_status_old;")
        op.execute("CREATE TYPE course_status AS ENUM ('planned', 'completed', 'failed');")
        op.execute(
            "ALTER TABLE courses ALTER COLUMN status TYPE course_status USING "
            "CASE "
            "WHEN lower(status::text) = 'in_progress' THEN 'planned'::course_status "
            "WHEN lower(status::text) = 'planned' THEN 'planned'::course_status "
            "WHEN lower(status::text) = 'completed' THEN 'completed'::course_status "
            "WHEN lower(status::text) = 'failed' THEN 'failed'::course_status "
            "ELSE 'planned'::course_status "
            "END;"
        )
        op.execute("DROP TYPE course_status_old;")
    else:
        with op.batch_alter_table("courses") as batch_op:
            batch_op.execute(
                sa.text(
                    "UPDATE courses SET status = 'planned' WHERE status = 'in_progress'"
                )
            )
            batch_op.alter_column(
                "status",
                existing_type=sa.Enum(
                    "planned", "in_progress", "completed", name="course_status"
                ),
                type_=sa.Enum("planned", "completed", "failed", name="course_status"),
                existing_nullable=False,
            )


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("ALTER TYPE course_status RENAME TO course_status_new;")
        op.execute(
            "CREATE TYPE course_status AS ENUM ('planned', 'in_progress', 'completed');"
        )
        op.execute(
            "ALTER TABLE courses ALTER COLUMN status TYPE course_status USING "
            "CASE "
            "WHEN lower(status::text) = 'failed' THEN 'planned'::course_status "
            "WHEN lower(status::text) = 'completed' THEN 'completed'::course_status "
            "ELSE 'planned'::course_status "
            "END;"
        )
        op.execute("DROP TYPE course_status_new;")
    else:
        with op.batch_alter_table("courses") as batch_op:
            batch_op.execute(
                sa.text(
                    "UPDATE courses SET status = 'planned' WHERE status = 'failed'"
                )
            )
            batch_op.alter_column(
                "status",
                existing_type=sa.Enum("planned", "completed", "failed", name="course_status"),
                type_=sa.Enum(
                    "planned", "in_progress", "completed", name="course_status"
                ),
                existing_nullable=False,
            )
