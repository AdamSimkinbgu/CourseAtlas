"""Course service with prerequisite validation and GPA calculation."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, List, Optional
from uuid import UUID

from app.domain.models import Course, CourseStatus
from app.exceptions import NotFoundError, ValidationError
from app.repositories.courses import CourseRepository
from app.repositories.graphs import GraphRepository


@dataclass
class CourseCreate:
    graph_id: UUID
    code: str
    title: str
    credits: int
    term: Optional[str] = None
    status: CourseStatus = CourseStatus.PLANNED
    position_x: float = 0.0
    position_y: float = 0.0
    is_pass_fail: bool = False


class CourseService:
    def __init__(
        self, course_repo: CourseRepository, graph_repo: GraphRepository
    ) -> None:
        self.course_repo = course_repo
        self.graph_repo = graph_repo

    # CRUD -----------------------------------------------------------------
    def add_course(self, payload: CourseCreate) -> Course:
        if self.graph_repo.get(payload.graph_id) is None:
            raise NotFoundError("Graph not found")
        course = Course(
            graph_id=payload.graph_id,
            code=payload.code,
            title=payload.title,
            credits=payload.credits,
            term=payload.term,
            status=payload.status,
            position_x=payload.position_x,
            position_y=payload.position_y,
            is_pass_fail=payload.is_pass_fail,
        )
        return self.course_repo.create(course)

    def update_course(self, course_id: UUID, data: dict[str, object]) -> Course:
        course = self._get_course_or_error(course_id)
        return self.course_repo.update(course, **data)

    def delete_course(self, course_id: UUID) -> None:
        course = self._get_course_or_error(course_id)
        self.course_repo.delete(course)

    # Prerequisites --------------------------------------------------------
    def set_prerequisites(self, course_id: UUID, prerequisites: List[dict]) -> Course:
        course = self._get_course_or_error(course_id)
        course_ids = [UUID(str(item["course_id"])) for item in prerequisites]
        self._validate_prerequisites(course, course_ids)
        normalized = []
        for idx, cid in enumerate(course_ids):
            prereq = prerequisites[idx]
            normalized.append(
                {"course_id": str(cid), "condition": prereq.get("condition")}
            )
        return self.course_repo.update(course, prerequisites=normalized)

    def _validate_prerequisites(
        self, course: Course, prereq_ids: Iterable[UUID]
    ) -> None:
        prereq_set = set(prereq_ids)
        for cid in prereq_set:
            referenced = self.course_repo.get(cid)
            if referenced is None:
                raise ValidationError("Prerequisite course not found")
            if referenced.graph_id != course.graph_id:
                raise ValidationError("Prerequisite must belong to same graph")
        if self._would_create_cycle(course.id, course.graph_id, prereq_set):
            raise ValidationError("Prerequisite cycle detected")

    def _would_create_cycle(
        self, course_id: UUID, graph_id: UUID, prereq_ids: set[UUID]
    ) -> bool:
        adjacency: dict[UUID, list[UUID]] = defaultdict(list)
        for existing in self.course_repo.list_by_graph(graph_id):
            for prereq in existing.prerequisites:
                adjacency[existing.id].append(UUID(str(prereq["course_id"])))
        adjacency[course_id] = list(prereq_ids)

        indegree: dict[UUID, int] = defaultdict(int)
        nodes = set(adjacency.keys()) | {
            cid for values in adjacency.values() for cid in values
        }
        for node in nodes:
            indegree.setdefault(node, 0)
        for _src, targets in adjacency.items():
            for tgt in targets:
                indegree[tgt] += 1

        queue = deque(node for node in nodes if indegree[node] == 0)
        visited = 0
        while queue:
            node = queue.popleft()
            visited += 1
            for neighbor in adjacency.get(node, []):
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    queue.append(neighbor)
        return visited != len(nodes)

    # Analytics ------------------------------------------------------------
    def calculate_graph_gpa(self, graph_id: UUID) -> dict[str, Decimal]:
        courses = self.course_repo.list_by_graph(graph_id)
        total_points = Decimal("0")
        total_credits = Decimal("0")
        attempted = Decimal("0")
        earned = Decimal("0")

        for course in courses:
            credits = Decimal(course.credits)
            attempted += credits
            if course.status == CourseStatus.COMPLETED:
                earned += credits
            if course.is_pass_fail:
                continue
            if course.grade is None:
                continue
            total_points += Decimal(course.grade) * credits
            total_credits += credits

        gpa = Decimal("0") if total_credits == 0 else total_points / total_credits
        return {
            "gpa": gpa.quantize(Decimal("0.00")),
            "credits_attempted": attempted,
            "credits_earned": earned,
        }

    # Helpers --------------------------------------------------------------
    def _get_course_or_error(self, course_id: UUID) -> Course:
        course = self.course_repo.get(course_id)
        if course is None:
            raise NotFoundError("Course not found")
        return course
