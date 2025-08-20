from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    from app.core.db import Base
    from app.models import appointment, company, company_user, notification, service, user

    Base.metadata.create_all(bind=op.get_bind())


def downgrade():
    from app.core.db import Base

    Base.metadata.drop_all(bind=op.get_bind())
