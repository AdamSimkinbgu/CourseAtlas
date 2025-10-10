"""FastAPI application entrypoint with basic health endpoint."""

from typing import Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Course Atlas API")

allowed_origins: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", tags=["health"])
def health_check() -> Dict[str, str]:
    """Verify the API process is running."""
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root() -> Dict[str, str]:
    """Provide a simple root response for manual checks."""
    return {"message": "Course Atlas API is running"}
