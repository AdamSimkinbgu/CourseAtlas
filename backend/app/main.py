"""FastAPI application entrypoint with basic health endpoint."""

from typing import Dict

from fastapi import FastAPI

app = FastAPI(title="Course Atlas API")


@app.get("/healthz", tags=["health"])
def health_check() -> Dict[str, str]:
    """Verify the API process is running."""
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root() -> Dict[str, str]:
    """Provide a simple root response for manual checks."""
    return {"message": "Course Atlas API is running"}
