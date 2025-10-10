from uuid import UUID, uuid4

import pytest

from app.repositories.users import UserRepository
from app.services.users import UserService


def test_ensure_user_exists_creates_when_missing(session):
    repo = UserRepository(session)
    service = UserService(repo)

    user_id = service.ensure_user_exists({"email": "user@example.com", "name": "User"})
    assert isinstance(user_id, UUID)

    # Calling again should reuse same user
    second = service.ensure_user_exists({"email": "user@example.com"})
    assert second == user_id


def test_get_user_not_found(session):
    repo = UserRepository(session)
    service = UserService(repo)

    with pytest.raises(Exception) as exc:
        service.get_user(uuid4())
    assert exc.value.__class__.__name__ == "NotFoundError"
