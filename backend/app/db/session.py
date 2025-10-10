"""Database session management."""

from collections.abc import Generator

from sqlmodel import Session, create_engine

from app.core.config import settings

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args=connect_args,
)


def get_session() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""

    with Session(engine) as session:
        yield session
