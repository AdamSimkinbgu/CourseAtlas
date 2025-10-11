"""Exception to HTTP mapping for the API."""

from fastapi import FastAPI, status
from fastapi.responses import JSONResponse

from app.exceptions import NotFoundError, PermissionError, ValidationError


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found_handler(_, exc: NotFoundError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(ValidationError)
    async def validation_handler(_, exc: ValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": str(exc)},
        )

    @app.exception_handler(PermissionError)
    async def permission_handler(_, exc: PermissionError):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": str(exc)},
        )
