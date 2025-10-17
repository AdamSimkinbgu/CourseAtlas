"""Graph service encapsulating plan operations."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, Iterable, List, Optional, Tuple
from uuid import UUID

from app.domain.models import Course, CourseStatus, Graph, TemplateMetadata, Visibility
from app.exceptions import NotFoundError, PermissionError, ValidationError
from app.repositories.courses import CourseRepository
from app.repositories.graphs import GraphRepository


@dataclass
class GraphCreate:
    owner_id: UUID
    title: str
    description: Optional[str] = None
    is_template: bool = False
    visibility: Optional[Visibility] = None
    containers: Optional[List[Dict[str, Any]]] = None
    container_assignments: Optional[Dict[str, str]] = None


class GraphService:
    def __init__(
        self, graph_repo: GraphRepository, course_repo: CourseRepository
    ) -> None:
        self.graph_repo = graph_repo
        self.course_repo = course_repo

    def create_graph(self, payload: GraphCreate) -> Graph:
        graph = Graph(
            owner_id=payload.owner_id,
            title=payload.title,
            description=payload.description,
            is_template=payload.is_template,
        )
        if payload.visibility is not None:
            graph.visibility = payload.visibility
        if payload.containers is not None:
            graph.containers = payload.containers
        if payload.container_assignments is not None:
            graph.container_assignments = payload.container_assignments
        return self.graph_repo.create(graph)

    def list_graphs(self, owner_id: UUID) -> List[Graph]:
        return self.graph_repo.list_by_owner(owner_id)

    def get_graph(self, graph_id: UUID, *, requesting_user: UUID) -> Graph:
        graph = self.graph_repo.get(graph_id)
        if graph is None:
            raise NotFoundError("Graph not found")
        if graph.owner_id != requesting_user and not graph.is_template:
            raise PermissionError("Graph access denied")
        return graph

    def update_graph(
        self, graph_id: UUID, data: Dict[str, object], *, requesting_user: UUID
    ) -> Graph:
        graph = self.get_graph(graph_id, requesting_user=requesting_user)
        if graph.owner_id != requesting_user:
            raise PermissionError("Only owner can update graph")
        if "container_assignments" in data:
            self._validate_container_assignments(
                data["container_assignments"], graph_id
            )
        return self.graph_repo.update(graph, **data)

    def duplicate_graph(self, graph_id: UUID, new_owner_id: UUID) -> Graph:
        graph = self.graph_repo.get(graph_id)
        if graph is None:
            raise NotFoundError("Graph not found")

        clone = self.graph_repo.duplicate(graph, new_owner_id=new_owner_id)
        source_courses = self.course_repo.list_by_graph(graph.id)
        course_map: Dict[UUID, Course] = {}
        for course in source_courses:
            duplicated = Course(
                graph_id=clone.id,
                code=course.code,
                title=course.title,
                credits=course.credits,
                term=course.term,
                status=course.status,
                prerequisites=[],
                grade=None,
                is_pass_fail=course.is_pass_fail,
                position_x=course.position_x,
                position_y=course.position_y,
                notes=None,
            )
            duplicated = self.course_repo.create(duplicated)
            course_map[course.id] = duplicated

        # Restore prerequisites referencing new ids
        for original in source_courses:
            clone_course = course_map[original.id]
            translated = []
            for prereq in original.prerequisites:
                course_id = prereq.get("course_id")
                if course_id and UUID(str(course_id)) in course_map:
                    translated.append(
                        {
                            "course_id": str(course_map[UUID(str(course_id))].id),
                            "condition": prereq.get("condition"),
                        }
                    )
            self.course_repo.update(clone_course, prerequisites=translated)

        if graph.container_assignments:
            translated_assignments: Dict[str, str] = {}
            for original_id, container_id in graph.container_assignments.items():
                try:
                    original_uuid = UUID(str(original_id))
                except ValueError:
                    continue
                mapped = course_map.get(original_uuid)
                if mapped:
                    translated_assignments[str(mapped.id)] = container_id
            self.graph_repo.update(clone, container_assignments=translated_assignments)

        return clone

    def delete_graph(self, graph_id: UUID, *, requesting_user: UUID) -> None:
        graph = self.get_graph(graph_id, requesting_user=requesting_user)
        if graph.owner_id != requesting_user:
            raise PermissionError("Only owner can delete graph")
        # remove associated courses
        for course in self.course_repo.list_by_graph(graph.id):
            self.course_repo.delete(course)
        self.graph_repo.delete(graph)

    def get_graph_with_courses(
        self, graph_id: UUID, *, requesting_user: UUID
    ) -> Tuple[Graph, List[Course]]:
        graph = self.get_graph(graph_id, requesting_user=requesting_user)
        courses = self.course_repo.list_by_graph(graph.id)
        return graph, courses

    def export_graph(
        self, graph_id: UUID, *, requesting_user: UUID
    ) -> Dict[str, object]:
        graph, courses = self.get_graph_with_courses(
            graph_id, requesting_user=requesting_user
        )
        return {
            "graph": {
                "id": str(graph.id),
                "title": graph.title,
                "description": graph.description,
                "is_template": graph.is_template,
                "visibility": graph.visibility.value,
                "containers": graph.containers,
                "container_assignments": graph.container_assignments,
            },
            "courses": [
                {
                    "id": str(course.id),
                    "code": course.code,
                    "title": course.title,
                    "credits": course.credits,
                    "term": course.term,
                    "status": course.status.value,
                    "prerequisites": course.prerequisites,
                    "grade": str(course.grade) if course.grade is not None else None,
                    "is_pass_fail": course.is_pass_fail,
                    "position": {"x": course.position_x, "y": course.position_y},
                    "notes": course.notes,
                    "created_at": course.created_at.isoformat(),
                    "updated_at": course.updated_at.isoformat(),
                }
                for course in courses
            ],
        }

    def publish_template(
        self, graph_id: UUID, metadata: TemplateMetadata
    ) -> TemplateMetadata:
        graph = self.graph_repo.get(graph_id)
        if graph is None:
            raise NotFoundError("Graph not found")
        graph.is_template = True
        self.graph_repo.update(graph)
        metadata.graph_id = graph.id
        return self.graph_repo.create_template_metadata(metadata)

    def list_public_templates(self) -> List[Graph]:
        return self.graph_repo.list_public_templates()

    def import_graph_data(
        self,
        graph_id: UUID,
        *,
        requesting_user: UUID,
        containers: Optional[List[Dict[str, Any]]] = None,
        container_assignments: Optional[Dict[str, str]] = None,
        courses: Iterable[Dict[str, Any]],
        replace_existing: bool,
    ) -> int:
        graph = self.get_graph(graph_id, requesting_user=requesting_user)
        course_payloads = list(courses)
        if replace_existing:
            for existing in self.course_repo.list_by_graph(graph.id):
                self.course_repo.delete(existing)
        id_map: Dict[str, Course] = {}

        # Create course shells first
        for payload in course_payloads:
            status_value = payload.get("status")
            if isinstance(status_value, CourseStatus):
                status = status_value
            elif isinstance(status_value, str):
                try:
                    status = CourseStatus(status_value)
                except ValueError as exc:
                    raise ValidationError(f"Unknown course status {status_value}") from exc
            else:
                status = CourseStatus.PLANNED
            grade_value = payload.get("grade")
            grade_decimal = None
            if grade_value is not None:
                try:
                    grade_decimal = Decimal(str(grade_value))
                except Exception as exc:
                    raise ValidationError(f"Invalid grade value {grade_value}") from exc
            course = Course(
                graph_id=graph.id,
                code=payload["code"],
                title=payload["title"],
                credits=payload["credits"],
                term=payload.get("term"),
                status=status,
                grade=grade_decimal,
                is_pass_fail=payload.get("is_pass_fail", False),
                position_x=payload.get("position", {}).get("x", 0.0),
                position_y=payload.get("position", {}).get("y", 0.0),
                notes=payload.get("notes"),
            )
            course = self.course_repo.create(course)
            original_id = payload.get("id") or course.id
            lookup_key = str(original_id)
            id_map[lookup_key] = course

        # Apply prerequisites
        for payload in course_payloads:
            original_id = payload.get("id")
            if original_id is None:
                continue
            lookup_key = str(original_id)
            course = id_map[lookup_key]
            normalized: List[Dict[str, Any]] = []
            for prereq in payload.get("prerequisites", []):
                source_id = prereq.get("course_id")
                if source_id is None:
                    continue
                source_course = id_map.get(str(source_id))
                if source_course is None:
                    raise ValidationError(
                        f"Prerequisite {source_id} not present in import payload"
                    )
                normalized.append(
                    {
                        "course_id": str(source_course.id),
                        "condition": prereq.get("condition"),
                    }
                )
            if normalized:
                self.course_repo.update(course, prerequisites=normalized)

        update_data: Dict[str, object] = {}
        if containers is not None:
            update_data["containers"] = containers
        if container_assignments is not None:
            # translate course ids if needed
            translated: Dict[str, str] = {}
            for course_id, container_id in container_assignments.items():
                if course_id in id_map:
                    translated[str(id_map[course_id].id)] = container_id
                else:
                    translated[course_id] = container_id
            update_data["container_assignments"] = translated
        if update_data:
            self.graph_repo.update(graph, **update_data)
        return len(course_payloads)

    def _validate_container_assignments(
        self, assignments: object, graph_id: UUID
    ) -> None:
        if assignments is None:
            return
        if not isinstance(assignments, dict):
            raise ValidationError("container_assignments must be a mapping")
        valid_ids = {
            str(course.id) for course in self.course_repo.list_by_graph(graph_id)
        }
        for course_id in assignments.keys():
            if course_id not in valid_ids:
                raise ValidationError(
                    f"container_assignments references unknown course {course_id}"
                )
