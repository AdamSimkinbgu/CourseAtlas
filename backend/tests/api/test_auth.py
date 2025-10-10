from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.main import app


@pytest.fixture()
def client():
    return TestClient(app)


def test_me_requires_auth(client):
    response = client.get("/api/v1/me")
    assert response.status_code == 403


def test_me_returns_user_when_authenticated(client):
    user_id = uuid4()

    def override():
        return type("User", (), {"id": user_id, "email": "user@example.com"})()

    app.dependency_overrides[get_current_user] = override
    response = client.get("/api/v1/me")
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json() == {"id": str(user_id), "email": "user@example.com"}
