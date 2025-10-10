"""User service operations."""

from typing import Any, Dict
from uuid import UUID

from app.exceptions import NotFoundError
from app.repositories.users import UserRepository


class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    def ensure_user_exists(self, payload: Dict[str, Any]) -> UUID:
        email = payload.get("email")
        display_name = payload.get("name") or email
        avatar_url = payload.get("picture")
        if not email:
            raise ValueError("email is required in auth payload")

        user = self.repo.get_by_email(email)
        if user is None:
            user = self.repo.create(
                email=email, display_name=display_name, avatar_url=avatar_url
            )
        return user.id

    def get_user(self, user_id: UUID):
        try:
            user = self.repo.get_by_id(user_id)
        except Exception as exc:  # pragma: no cover - defensive
            raise NotFoundError("User not found") from exc
        if user is None:
            raise NotFoundError("User not found")
        return user
