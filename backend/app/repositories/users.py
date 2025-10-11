"""User repository."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlmodel import Session, select

from app.domain.models import User


class UserRepository:
    """Data access helpers for `User`."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        statement = select(User).where(User.id == user_id)
        return self.session.exec(statement).first()

    def get_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def get_by_provider_id(self, provider_id: str) -> Optional[User]:
        statement = select(User).where(User.auth_provider_id == provider_id)
        return self.session.exec(statement).first()

    def update(self, user: User, **data: object) -> User:
        for key, value in data.items():
            setattr(user, key, value)
        self.session.add(user)
        self.session.flush()
        self.session.refresh(user)
        return user

    def create(
        self,
        *,
        email: str,
        display_name: str,
        auth_provider_id: str,
        avatar_url: Optional[str] = None,
    ) -> User:
        user = User(
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            auth_provider_id=auth_provider_id,
        )
        self.session.add(user)
        self.session.flush()
        self.session.refresh(user)
        return user
