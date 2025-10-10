"""Base repository utilities."""

from collections.abc import Callable
from contextlib import contextmanager
from typing import Generator, TypeVar

from sqlmodel import Session

T = TypeVar("T")


@contextmanager
def transactional(
    session_provider: Callable[[], Generator[Session, None, None]]
) -> Generator[Session, None, None]:
    """Provide a transactional session scope using the FastAPI dependency."""

    session_gen = session_provider()
    session = next(session_gen)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        try:
            next(session_gen)
        except StopIteration:
            pass
