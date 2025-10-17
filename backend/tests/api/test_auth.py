import os
import shutil
import tempfile
from types import SimpleNamespace
from uuid import uuid4

import pytest
import jwt
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, select

TEST_DB_DIR = tempfile.mkdtemp()
TEST_DB_PATH = os.path.join(TEST_DB_DIR, "test_auth.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from app.core.config import settings  # noqa: E402
from app.core.security import get_current_user  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.domain.models import User  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def cleanup_db_dir():
    yield
    engine.dispose()
    shutil.rmtree(TEST_DB_DIR, ignore_errors=True)


@pytest.fixture()
def client():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    return TestClient(app)


def test_me_requires_auth(client):
    response = client.get("/api/v1/me")
    assert response.status_code == 403


def test_me_returns_user_when_authenticated(client):
    user_id = uuid4()

    def override():
        return SimpleNamespace(id=user_id, email="user@example.com")

    app.dependency_overrides[get_current_user] = override
    response = client.get("/api/v1/me")
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json() == {"id": str(user_id), "email": "user@example.com"}


def test_me_validates_jwt_via_jwks(client, monkeypatch):
    settings.auth_audience = "authenticated"
    settings.auth_domain = "https://supabase.example.com"
    settings.supabase_jwt_secret = "test-secret"

    payload = {
        "sub": "supabase|auth-user",
        "email": "auth-user@example.com",
        "aud": settings.auth_audience,
        "iss": f"{settings.auth_domain.rstrip('/')}/auth/v1",
    }

    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")

    response = client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "auth-user@example.com"

    with Session(engine) as session:
        db_user = session.exec(select(User).where(User.email == "auth-user@example.com")).one()
        assert db_user.auth_provider_id == "supabase|auth-user"
