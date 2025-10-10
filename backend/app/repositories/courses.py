"""Course repository for CRUD operations."""

from __future__ import annotations

from typing import Iterable, Optional
from uuid import UUID

from sqlmodel import Session, select

from app.domain.models import Course


class CourseRepository:
    """Persistence helpers for `Course` entities."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, course: Course) -> Course:
        self.session.add(course)
        self.session.flush()
        self.session.refresh(course)
        return course

    def bulk_create(self, courses: Iterable[Course]) -> list[Course]:
        course_list = list(courses)
        self.session.add_all(course_list)
        self.session.flush()
        return [self.session.get(Course, c.id) for c in course_list]  # type: ignore[list-item]

    def get(self, course_id: UUID) -> Optional[Course]:
        return self.session.get(Course, course_id)

    def list_by_graph(self, graph_id: UUID) -> list[Course]:
        statement = select(Course).where(Course.graph_id == graph_id)
        return list(self.session.exec(statement))

    def update(self, course: Course, **data: object) -> Course:
        for key, value in data.items():
            setattr(course, key, value)
        self.session.add(course)
        self.session.flush()
        self.session.refresh(course)
        return course

    def delete(self, course: Course) -> None:
        self.session.delete(course)
