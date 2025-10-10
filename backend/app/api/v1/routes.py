"""Placeholder API routes."""

from typing import Dict

from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/v1")


@router.get("/ping", tags=["health"])
async def ping() -> Dict[str, str]:
    """Simple ping route to verify routing."""
    return {"message": "pong"}


@router.get("/me", tags=["users"])
async def current_user(user=Depends(get_current_user)) -> Dict[str, str]:  # noqa: B008
    return {"id": str(user.id), "email": user.email}
