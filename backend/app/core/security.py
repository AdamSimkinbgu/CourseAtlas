"""Authentication utilities for validating JWT tokens."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.config import settings
from app.db.session import get_session
from app.exceptions import NotFoundError
from app.repositories.users import UserRepository
from app.services.users import UserService

http_bearer = HTTPBearer()


@lru_cache(maxsize=1)
def _fetch_jwks() -> Dict[str, Any]:
    if not settings.auth_jwks_url:
        raise RuntimeError("AUTH_JWKS_URL not configured")
    response = httpx.get(settings.auth_jwks_url, timeout=10.0)
    response.raise_for_status()
    return response.json()


def _get_signing_key(token: str) -> Dict[str, str]:
    jwks = _fetch_jwks()
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    for key in jwks["keys"]:
        if key.get("kid") == kid:
            return key
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header"
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),  # noqa: B008
    session: Session = Depends(get_session),  # noqa: B008
):
    token = credentials.credentials
    signing_key = _get_signing_key(token)
    try:
        payload = jwt.decode(
            token,
            key=jwt.algorithms.RSAAlgorithm.from_jwk(signing_key),
            algorithms=["RS256"],
            audience=settings.auth_audience,
        )
    except jwt.PyJWTError as exc:  # pragma: no cover - network dependency
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
