"""Database session management."""

from typing import Dict, Generator

from sqlmodel import Session, create_engine

from app.core.config import settings

connect_args: Dict[str, object] = {}
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
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
