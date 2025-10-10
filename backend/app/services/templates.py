"""Template service for publishing and cloning."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.domain.models import Course, CourseStatus, Graph, TemplateMetadata
from app.exceptions import NotFoundError
from app.repositories.courses import CourseRepository
from app.repositories.graphs import GraphRepository
from app.repositories.templates import TemplateRepository


class TemplateService:
    def __init__(
        self,
        graph_repo: GraphRepository,
        course_repo: CourseRepository,
        template_repo: TemplateRepository,
    ) -> None:
        self.graph_repo = graph_repo
        self.course_repo = course_repo
        self.template_repo = template_repo

    def list_public_templates(self) -> list[Graph]:
        return self.template_repo.list_public_graphs()

    def publish_template(
        self,
        graph_id: UUID,
        tags: list[str],
        summary: str | None,
        preview_url: str | None,
    ) -> TemplateMetadata:
        graph = self.graph_repo.get(graph_id)
        if graph is None:
            raise NotFoundError("Graph not found")
        graph.is_template = True
        self.graph_repo.update(graph)
        metadata = TemplateMetadata(
            graph_id=graph.id,
            tags=tags,
            summary=summary,
            preview_image_url=preview_url,
            published_at=datetime.utcnow(),
        )
        return self.template_repo.save_metadata(metadata)

    def clone_template(self, template_graph_id: UUID, user_id: UUID) -> Graph:
        template = self.graph_repo.get(template_graph_id)
        if template is None or not template.is_template:
            raise NotFoundError("Template not found")
        clone = self.graph_repo.duplicate(template, new_owner_id=user_id)
        source_courses = self.course_repo.list_by_graph(template.id)
        for course in source_courses:
            cloned_course = Course(
                graph_id=clone.id,
                code=course.code,
                title=course.title,
                credits=course.credits,
                term=course.term,
                status=CourseStatus.PLANNED,
                prerequisites=[],
                grade=None,
                is_pass_fail=course.is_pass_fail,
                position_x=course.position_x,
                position_y=course.position_y,
                notes=None,
            )
            self.course_repo.create(cloned_course)
        return clone
