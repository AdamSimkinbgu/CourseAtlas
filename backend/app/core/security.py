"""Authentication utilities for validating JWT tokens."""

from __future__ import annotations

import jwt
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.config import settings
from app.db.session import get_session
from app.exceptions import NotFoundError
from app.repositories.users import UserRepository
from app.services.users import UserService

logger = logging.getLogger(__name__)

http_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),  # noqa: B008
    session: Session = Depends(get_session),  # noqa: B008
):
    token = credentials.credentials
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase JWT secret not configured",
        )
    issuer = f"{settings.auth_domain.rstrip('/')}/auth/v1"
    try:
        payload = jwt.decode(
            token,
            key=settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=settings.auth_audience,
            issuer=issuer,
        )
    except jwt.PyJWTError as exc:  # pragma: no cover - network dependency
        logger.exception("JWT decode failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    repo = UserRepository(session)
    service = UserService(repo)
    user_id = service.ensure_user_exists(payload)
    try:
        return service.get_user(user_id)
    except NotFoundError as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not provisioned"
        ) from exc
