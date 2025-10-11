from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from app.domain.models import CourseStatus
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
            "email": f"user-{uuid4()}@example.com",
            "name": "User",
        }
    )


def setup_graph_and_services(session):
    graph_repo = GraphRepository(session)
    course_repo = CourseRepository(session)
    graphs = GraphService(graph_repo, course_repo)
    courses = CourseService(course_repo, graph_repo)
    owner_id = create_user(session)
    graph = graphs.create_graph(GraphCreate(owner_id=owner_id, title="Plan"))
    return graph, graphs, courses, course_repo


def test_set_prerequisites_validates_same_graph(session):
    graph, _, courses, _ = setup_graph_and_services(session)
    other_graph, _, other_courses, _ = setup_graph_and_services(session)

    course = courses.add_course(
        CourseCreate(graph_id=graph.id, code="CS101", title="Intro", credits=3)
    )
    foreign = other_courses.add_course(
        CourseCreate(graph_id=other_graph.id, code="MATH", title="Math", credits=3)
    )

    with pytest.raises(Exception) as exc:
        courses.set_prerequisites(course.id, [{"course_id": str(foreign.id)}])
    assert exc.value.__class__.__name__ == "ValidationError"


def test_cycle_detection(session):
    graph, _, courses, repo = setup_graph_and_services(session)
    a = courses.add_course(
        CourseCreate(graph_id=graph.id, code="A", title="A", credits=3)
    )
    b = courses.add_course(
        CourseCreate(graph_id=graph.id, code="B", title="B", credits=3)
    )

    courses.set_prerequisites(b.id, [{"course_id": str(a.id)}])
    with pytest.raises(Exception) as exc:
        courses.set_prerequisites(a.id, [{"course_id": str(b.id)}])
    assert exc.value.__class__.__name__ == "ValidationError"


def test_calculate_gpa_excludes_pass_fail(session):
    graph, _, courses, repo = setup_graph_and_services(session)
    graded = courses.add_course(
        CourseCreate(graph_id=graph.id, code="CS", title="CS", credits=3)
    )
    repo.update(graded, grade=Decimal("3.7"), status=CourseStatus.COMPLETED)
    pass_fail = courses.add_course(
        CourseCreate(
            graph_id=graph.id, code="PE", title="PE", credits=2, is_pass_fail=True
        )
    )
    repo.update(pass_fail, status=CourseStatus.COMPLETED)

    summary = courses.calculate_graph_gpa(graph.id)
    assert summary["gpa"] == Decimal("3.70")
    assert summary["credits_attempted"] == Decimal("5")
    assert summary["credits_earned"] == Decimal("5")
