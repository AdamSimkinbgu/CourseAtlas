from uuid import UUID, uuid4

import pytest

from app.repositories.users import UserRepository
from app.services.users import UserService


def test_ensure_user_exists_creates_when_missing(session):
    repo = UserRepository(session)
    service = UserService(repo)

    payload = {
        "sub": "supabase|123",
        "email": "user@example.com",
        "name": "User",
        "picture": "https://example.com/avatar.png",
    }
    user_id = service.ensure_user_exists(payload)
    assert isinstance(user_id, UUID)

    # Calling again should reuse same user
    second = service.ensure_user_exists(
        {"sub": "supabase|123", "email": "user@example.com"}
    )
    assert second == user_id


def test_ensure_user_exists_updates_profile(session):
    repo = UserRepository(session)
    service = UserService(repo)

    payload = {
        "sub": "supabase|456",
        "email": "user2@example.com",
        "name": "User Two",
    }
    user_id = service.ensure_user_exists(payload)

    updated = service.ensure_user_exists(
        {
            "sub": "supabase|456",
            "email": "user2@example.com",
            "name": "User Two Updated",
            "picture": "https://example.com/new-avatar.png",
        }
    )

    assert updated == user_id
    user = repo.get_by_id(user_id)
    assert user is not None
    assert user.display_name == "User Two Updated"
    assert user.avatar_url == "https://example.com/new-avatar.png"


def test_get_user_not_found(session):
    repo = UserRepository(session)
    service = UserService(repo)

    with pytest.raises(Exception) as exc:
        service.get_user(uuid4())
    assert exc.value.__class__.__name__ == "NotFoundError"


def test_ensure_user_requires_sub(session):
    repo = UserRepository(session)
    service = UserService(repo)

    with pytest.raises(ValueError):
        service.ensure_user_exists({"email": "no-sub@example.com"})
