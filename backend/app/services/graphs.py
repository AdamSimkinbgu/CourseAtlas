"""Graph service encapsulating plan operations."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from app.domain.models import Course, Graph, TemplateMetadata
from app.exceptions import NotFoundError, PermissionError
from app.repositories.courses import CourseRepository
from app.repositories.graphs import GraphRepository


@dataclass
class GraphCreate:
    owner_id: UUID
    title: str
    description: Optional[str] = None
    is_template: bool = False


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
        return self.graph_repo.create(graph)

    def list_graphs(self, owner_id: UUID) -> list[Graph]:
        return self.graph_repo.list_by_owner(owner_id)

    def get_graph(self, graph_id: UUID, *, requesting_user: UUID) -> Graph:
        graph = self.graph_repo.get(graph_id)
        if graph is None:
            raise NotFoundError("Graph not found")
        if graph.owner_id != requesting_user and not graph.is_template:
            raise PermissionError("Graph access denied")
        return graph

    def update_graph(
        self, graph_id: UUID, data: dict[str, object], *, requesting_user: UUID
    ) -> Graph:
        graph = self.get_graph(graph_id, requesting_user=requesting_user)
        if graph.owner_id != requesting_user:
            raise PermissionError("Only owner can update graph")
        return self.graph_repo.update(graph, **data)

    def duplicate_graph(self, graph_id: UUID, new_owner_id: UUID) -> Graph:
        graph = self.graph_repo.get(graph_id)
        if graph is None:
            raise NotFoundError("Graph not found")

        clone = self.graph_repo.duplicate(graph, new_owner_id=new_owner_id)
        source_courses = self.course_repo.list_by_graph(graph.id)
        course_map: dict[UUID, Course] = {}
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

        return clone

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

    def list_public_templates(self) -> list[Graph]:
        return self.graph_repo.list_public_templates()
