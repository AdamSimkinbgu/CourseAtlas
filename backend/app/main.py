"""FastAPI ASGI application configured with settings and routers."""

from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.error_handlers import register_exception_handlers
from app.api.v1.routes import router as api_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, docs_url="/docs", openapi_url="/openapi.json")

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/healthz", tags=["health"])
def health_check() -> Dict[str, str]:
    """Verify the API process is running."""

    return {"status": "ok"}


@app.get("/", tags=["health"])
def root() -> Dict[str, str]:
    """Provide a simple root response for manual checks."""

    return {"message": "Course Atlas API is running"}
