from __future__ import annotations

import os
import shutil
import tempfile
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel

# Configure test database before importing the app
TEST_DB_DIR = tempfile.mkdtemp()
TEST_DB_PATH = os.path.join(TEST_DB_DIR, "test_api.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from app.core.security import get_current_user  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.domain import models  # noqa: E402, F401
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

    user_id = uuid4()

    def override_user():
        return SimpleNamespace(id=user_id, email="user@example.com")

    app.dependency_overrides[get_current_user] = override_user

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_graph_crud_flow(client: TestClient):
    create_resp = client.post(
        "/api/v1/graphs",
        json={"title": "My Plan", "description": "First semester"},
    )
    assert create_resp.status_code == 201
    created_body = create_resp.json()
    graph_id = created_body["id"]
    assert created_body["containers"] == []
    assert created_body["container_assignments"] == {}

    list_resp = client.get("/api/v1/graphs")
    assert list_resp.status_code == 200
    assert any(item["id"] == graph_id for item in list_resp.json())

    course_resp = client.post(
        f"/api/v1/graphs/{graph_id}/courses",
        json={"code": "CS101", "title": "Intro", "credits": 3},
    )
    assert course_resp.status_code == 201
    course_id = course_resp.json()["id"]

    update_course = client.patch(
        f"/api/v1/courses/{course_id}",
        json={"status": "completed", "grade": "87"},
    )
    assert update_course.status_code == 200
    assert update_course.json()["status"] == "completed"

    course_resp_2 = client.post(
        f"/api/v1/graphs/{graph_id}/courses",
        json={"code": "MATH101", "title": "Math", "credits": 4},
    )
    assert course_resp_2.status_code == 201
    course_id_2 = course_resp_2.json()["id"]

    prereq_resp = client.put(
        f"/api/v1/courses/{course_id_2}/prerequisites",
        json={"items": [{"course_id": course_id}]},
    )
    assert prereq_resp.status_code == 200
    assert prereq_resp.json()["prerequisites"]

    containers_payload = [
        {
            "id": "year-1",
            "title": "Year 1",
            "color": "#e0f2fe",
            "width": 320,
            "height": 200,
            "position": {"x": 0.0, "y": 0.0},
        }
    ]
    update_graph_resp = client.patch(
        f"/api/v1/graphs/{graph_id}",
        json={
            "containers": containers_payload,
            "container_assignments": {course_id: "year-1"},
        },
    )
    assert update_graph_resp.status_code == 200
    assert update_graph_resp.json()["containers"][0]["id"] == "year-1"

    detail_resp = client.get(f"/api/v1/graphs/{graph_id}")
    assert detail_resp.status_code == 200
    detail_body = detail_resp.json()
    assert len(detail_body["courses"]) == 2
    assert detail_body["graph"]["containers"][0]["title"] == "Year 1"
    assert list(detail_body["graph"]["container_assignments"].values()) == ["year-1"]

    export_resp = client.post(f"/api/v1/graphs/{graph_id}/export")
    assert export_resp.status_code == 200
    export_body = export_resp.json()
    assert export_body["graph"]["title"] == "My Plan"
    assert export_body["graph"]["containers"][0]["id"] == "year-1"

    duplicate_resp = client.post(f"/api/v1/graphs/{graph_id}/duplicate")
    assert duplicate_resp.status_code == 200
    clone_id = duplicate_resp.json()["id"]
    assert clone_id != graph_id

    clone_detail = client.get(f"/api/v1/graphs/{clone_id}")
    assert clone_detail.status_code == 200
    clone_body = clone_detail.json()
    assert clone_body["graph"]["containers"][0]["id"] == "year-1"
    clone_assignments = clone_body["graph"]["container_assignments"]
    assert set(clone_assignments.values()) == {"year-1"}
    assert len(clone_assignments) == 1
    assigned_course_id = next(iter(clone_assignments.keys()))
    assert assigned_course_id in {course["id"] for course in clone_body["courses"]}

    delete_resp = client.delete(f"/api/v1/graphs/{graph_id}")
    assert delete_resp.status_code == 204

    not_found = client.get(f"/api/v1/graphs/{graph_id}")
    assert not_found.status_code == 404


def test_export_import_replace(client: TestClient):
    source_resp = client.post("/api/v1/graphs", json={"title": "Source"})
    source_id = source_resp.json()["id"]

    base_course = client.post(
        f"/api/v1/graphs/{source_id}/courses",
        json={"code": "CS101", "title": "Intro", "credits": 3, "term": "Fall"},
    ).json()
    advanced_course = client.post(
        f"/api/v1/graphs/{source_id}/courses",
        json={
            "code": "CS201",
            "title": "Advanced",
            "credits": 4,
            "status": "planned",
        },
    ).json()

    client.put(
        f"/api/v1/courses/{advanced_course['id']}/prerequisites",
        json={"items": [{"course_id": base_course["id"]}]},
    )

    containers_payload = [
        {
            "id": "track-a",
            "title": "Track A",
            "color": "#fef08a",
            "width": 400,
            "height": 220,
            "position": {"x": 100.0, "y": 50.0},
        }
    ]
    client.patch(
        f"/api/v1/graphs/{source_id}",
        json={
            "containers": containers_payload,
            "container_assignments": {base_course["id"]: "track-a"},
        },
    )

    export_body = client.post(f"/api/v1/graphs/{source_id}/export").json()

    target_resp = client.post("/api/v1/graphs", json={"title": "Target"})
    target_id = target_resp.json()["id"]

    client.post(
        f"/api/v1/graphs/{target_id}/courses",
        json={"code": "PLACEHOLDER", "title": "Placeholder", "credits": 1},
    )

    import_payload = {
        "replace_existing": True,
        "containers": export_body["graph"]["containers"],
        "container_assignments": export_body["graph"]["container_assignments"],
        "courses": [
            {
                "id": course["id"],
                "code": course["code"],
                "title": course["title"],
                "credits": course["credits"],
                "term": course["term"],
                "status": course["status"],
                "grade": course["grade"],
                "is_pass_fail": course["is_pass_fail"],
                "position": course["position"],
                "notes": course["notes"],
                "prerequisites": course["prerequisites"],
            }
            for course in export_body["courses"]
        ],
    }

    import_resp = client.post(
        f"/api/v1/graphs/{target_id}/import",
        json=import_payload,
    )
    assert import_resp.status_code == 202
    assert import_resp.json()["imported"] == len(export_body["courses"])

    target_detail = client.get(f"/api/v1/graphs/{target_id}").json()
    returned_containers = target_detail["graph"]["containers"]
    sanitized = [
        {key: value for key, value in container.items() if key != "palette_id"}
        for container in returned_containers
    ]
    assert sanitized == containers_payload
    assert len(target_detail["courses"]) == len(export_body["courses"])
    target_assignments = target_detail["graph"]["container_assignments"]
    assert set(target_assignments.values()) == {"track-a"}
    assert len(target_assignments) == 1
    assigned_target_id = next(iter(target_assignments.keys()))
    assert assigned_target_id in {
        course["id"] for course in target_detail["courses"]
    }
    by_code = {course["code"]: course for course in target_detail["courses"]}
    assert by_code["CS201"]["prerequisites"]  # prerequisite preserved


def test_template_publish_and_clone(client: TestClient):
    graph_resp = client.post(
        "/api/v1/graphs",
        json={"title": "Template Source"},
    )
    graph_id = graph_resp.json()["id"]

    course = client.post(
        f"/api/v1/graphs/{graph_id}/courses",
        json={"code": "TEMP101", "title": "Template Course", "credits": 3},
    ).json()
    container_payload = [
        {
            "id": "template-container",
            "title": "Template Container",
            "color": "#fde68a",
            "width": 280,
            "height": 180,
            "position": {"x": 10.0, "y": 20.0},
        }
    ]
    client.patch(
        f"/api/v1/graphs/{graph_id}",
        json={
            "containers": container_payload,
            "container_assignments": {course["id"]: "template-container"},
        },
    )

    publish_resp = client.post(
        f"/api/v1/templates/{graph_id}/publish",
        json={"tags": ["cs"], "summary": "CS plan"},
    )
    assert publish_resp.status_code == 201

    list_resp = client.get("/api/v1/templates")
    templates = list_resp.json()
    assert templates and templates[0]["graph"]["id"] == graph_id

    clone_resp = client.post(f"/api/v1/templates/{graph_id}/clone")
    assert clone_resp.status_code == 201
    clone_id = clone_resp.json()["id"]
    assert clone_id != graph_id

    detail = client.get(f"/api/v1/graphs/{clone_id}").json()
    assert detail["graph"]["containers"][0]["id"] == "template-container"
    assert set(detail["graph"]["container_assignments"].values()) == {"template-container"}
