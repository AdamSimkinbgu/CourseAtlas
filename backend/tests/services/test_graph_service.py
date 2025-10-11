from uuid import UUID, uuid4

import pytest

from app.repositories.courses import CourseRepository
from app.repositories.graphs import GraphRepository
from app.repositories.users import UserRepository
from app.services.courses import CourseCreate, CourseService
from app.services.graphs import GraphCreate, GraphService
from app.services.users import UserService


def create_user(session) -> UUID:
    repo = UserRepository(session)
    service = UserService(repo)
    return service.ensure_user_exists(
        {
            "sub": f"supabase|{uuid4()}",
            "email": f"{uuid4()}@example.com",
            "name": "User",
        }
    )


def test_graph_duplication_clones_courses(session):
    graph_repo = GraphRepository(session)
    course_repo = CourseRepository(session)
    graphs = GraphService(graph_repo, course_repo)
    courses = CourseService(course_repo, graph_repo)

    owner_id = create_user(session)
    graph = graphs.create_graph(GraphCreate(owner_id=owner_id, title="Plan"))

    course = courses.add_course(
        CourseCreate(graph_id=graph.id, code="CS101", title="Intro", credits=3)
    )
    courses.set_prerequisites(course.id, [])

    new_owner = create_user(session)
    clone = graphs.duplicate_graph(graph.id, new_owner)

    cloned_courses = course_repo.list_by_graph(clone.id)
    assert len(cloned_courses) == 1
    assert cloned_courses[0].code == "CS101"
    assert cloned_courses[0].prerequisites == []


def test_graph_permission_enforced(session):
    graph_repo = GraphRepository(session)
    course_repo = CourseRepository(session)
    graphs = GraphService(graph_repo, course_repo)

    owner_id = create_user(session)
    other_id = create_user(session)
    graph = graphs.create_graph(GraphCreate(owner_id=owner_id, title="Plan"))

    with pytest.raises(Exception) as exc:
        graphs.get_graph(graph.id, requesting_user=other_id)
    assert exc.value.__class__.__name__ == "PermissionError"

    fetched = graphs.get_graph(graph.id, requesting_user=owner_id)
    assert fetched.id == graph.id
