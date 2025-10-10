"""Placeholder API routes."""

from typing import Dict

from fastapi import APIRouter

router = APIRouter(prefix="/v1")


@router.get("/ping", tags=["health"])
async def ping() -> Dict[str, str]:
    """Simple ping route to verify routing."""
    return {"message": "pong"}
