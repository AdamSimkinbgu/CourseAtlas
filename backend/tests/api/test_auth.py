import json
import os
import shutil
import tempfile
from base64 import urlsafe_b64encode
from typing import List
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, select

TEST_DB_DIR = tempfile.mkdtemp()
TEST_DB_PATH = os.path.join(TEST_DB_DIR, "test_auth.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from app.core.config import settings  # noqa: E402
import app.core.security as security_module  # noqa: E402
from app.core.security import _fetch_jwks, get_current_user  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.domain.models import User  # noqa: E402
from app.main import app  # noqa: E402


def _encode_segment(data: dict) -> str:
    """Return URL-safe base64 string without padding."""

    return urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")


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
    settings.auth_audience = "test-audience"
    settings.auth_jwks_url = "https://auth.example.com/.well-known/jwks.json"
    _fetch_jwks.cache_clear()

    jwks_payload = {"keys": [{"kid": "kid123", "kty": "RSA", "use": "sig"}]}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return jwks_payload

    def fake_httpx_get(url: str, timeout: float):
        assert url == settings.auth_jwks_url
        return FakeResponse()

    monkeypatch.setattr("app.core.security.httpx.get", fake_httpx_get)

    class FakeRSA:
        @staticmethod
        def from_jwk(jwk: dict) -> str:
            assert jwk["kid"] == "kid123"
            return "decoded-key"

    monkeypatch.setattr(
        security_module.jwt.algorithms,
        "RSAAlgorithm",
        FakeRSA,
        raising=False,
    )

    decoded_payload = {
        "sub": "supabase|auth-user",
        "email": "auth-user@example.com",
        "name": "Auth User",
        "picture": "https://example.com/pic.png",
    }

    def fake_decode(token: str, key: str, algorithms: List[str], audience: str):
        assert key == "decoded-key"
        assert algorithms == ["RS256"]
        assert audience == settings.auth_audience
        return decoded_payload

    monkeypatch.setattr("app.core.security.jwt.decode", fake_decode)

    header = {"alg": "RS256", "kid": "kid123"}
    payload = {
        "sub": "supabase|auth-user",
        "email": "auth-user@example.com",
        "aud": settings.auth_audience,
    }
    signature = urlsafe_b64encode(b"signature").decode().rstrip("=")
    token = f"{_encode_segment(header)}.{_encode_segment(payload)}.{signature}"

    response = client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "auth-user@example.com"

    with Session(engine) as session:
        db_user = session.exec(select(User).where(User.email == "auth-user@example.com")).one()
        assert db_user.auth_provider_id == "supabase|auth-user"
