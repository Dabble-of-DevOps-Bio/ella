"""Add JSON schema table

Revision ID: 022118518e99
Revises: 4fef0af39a20
Create Date: 2019-02-28 07:25:25.613054

"""

# revision identifiers, used by Alembic.
revision = "022118518e99"
down_revision = "4fef0af39a20"
branch_labels = None
depends_on = None

from alembic import op
from sqlalchemy.orm.session import Session
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from vardb.datamodel.jsonschemas.update_schemas import update_schemas


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "jsonschema",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("schema", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_jsonschema")),
    )

    op.create_index("ix_jsonschema_unique", "jsonschema", ["name", "version"], unique=True)

    op.add_column(
        "annotation", sa.Column("schema_version", sa.Integer(), server_default=sa.FetchedValue())
    )
    op.add_column(
        "filterconfig", sa.Column("schema_version", sa.Integer(), server_default=sa.FetchedValue())
    )

    # Add schemas to database
    session = Session(bind=op.get_bind())
    update_schemas(session)
    session.flush()

    # Run an update on the two tables that will run update trigger and set correct schema version on all rows
    print(
        "Setting schema version on annotation and filterconfig table. This could take some time..."
    )
    op.execute("UPDATE annotation SET annotations=annotations")
    op.execute("UPDATE filterconfig SET filterconfig=filterconfig")

    # Add not null criteria to columns, now that it should have been set
    op.execute("ALTER TABLE annotation ALTER COLUMN schema_version SET NOT NULL")
    op.execute("ALTER TABLE filterconfig ALTER COLUMN schema_version SET NOT NULL")

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("filterconfig", "schema_version")
    op.drop_column("annotation", "schema_version")
    op.drop_table("jsonschema")
    # ### end Alembic commands ###
