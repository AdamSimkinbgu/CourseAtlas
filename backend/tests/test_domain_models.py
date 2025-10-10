"""Domain model tests."""

from sqlalchemy import create_engine
from sqlmodel import Session, SQLModel

from app.domain.models import Course, CourseStatus, Graph, User


def create_engine_memory():
    return create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )


def test_course_defaults():
    engine = create_engine_memory()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email="student@example.com", display_name="Student")
        session.add(user)
        session.commit()
        session.refresh(user)

        graph = Graph(owner_id=user.id, title="Plan", description=None)
        session.add(graph)
        session.commit()
        session.refresh(graph)

        course = Course(graph_id=graph.id, code="CS101", title="Intro CS", credits=3)
        session.add(course)
        session.commit()
        session.refresh(course)

        assert course.status is CourseStatus.PLANNED
        assert course.prerequisites == []
        assert course.is_pass_fail is False
        assert course.position_x == 0.0 and course.position_y == 0.0


def test_visibility_default():
    engine = create_engine_memory()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email="owner@example.com", display_name="Owner")
        session.add(user)
        session.commit()
        session.refresh(user)

        graph = Graph(owner_id=user.id, title="Visibility Test")
        session.add(graph)
        session.commit()
        session.refresh(graph)

        assert graph.visibility.value == "private"
