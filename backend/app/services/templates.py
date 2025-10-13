"""Template service for publishing and cloning."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from app.domain.models import Course, CourseStatus, Graph, TemplateMetadata
from app.exceptions import NotFoundError
from app.repositories.courses import CourseRepository
from app.repositories.graphs import GraphRepository
from app.repositories.templates import TemplateRepository


@dataclass
class TemplateView:
    graph: Graph
    metadata: Optional[TemplateMetadata]


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

    def list_public_templates(self) -> List[TemplateView]:
        views: List[TemplateView] = []
        graphs = self.template_repo.list_public_graphs()
        for graph in graphs:
            meta = self.template_repo.get_metadata_for_graph(graph.id)
            views.append(TemplateView(graph=graph, metadata=meta))
        return views

    def publish_template(
        self,
        graph_id: UUID,
        tags: List[str],
        summary: Optional[str],
        preview_url: Optional[str],
    ) -> TemplateView:
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
        saved = self.template_repo.save_metadata(metadata)
        return TemplateView(graph=graph, metadata=saved)

    def clone_template(self, template_graph_id: UUID, user_id: UUID) -> Graph:
        template = self.graph_repo.get(template_graph_id)
        if template is None or not template.is_template:
            raise NotFoundError("Template not found")
        clone = self.graph_repo.duplicate(template, new_owner_id=user_id)
        source_courses = self.course_repo.list_by_graph(template.id)
        course_map: Dict[UUID, Course] = {}
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
            cloned_course = self.course_repo.create(cloned_course)
            course_map[course.id] = cloned_course

        for original in source_courses:
            cloned_course = course_map[original.id]
            translated: List[Dict[str, Optional[str]]] = []
            for prereq in original.prerequisites:
                course_id = prereq.get("course_id")
                if not course_id:
                    continue
                source_id = UUID(str(course_id))
                mapped = course_map.get(source_id)
                if mapped:
                    translated.append(
                        {
                            "course_id": str(mapped.id),
                            "condition": prereq.get("condition"),
                        }
                    )
            self.course_repo.update(cloned_course, prerequisites=translated)
        if template.container_assignments:
            translated_assignments: Dict[str, str] = {}
            for original_id, container_id in template.container_assignments.items():
                try:
                    original_uuid = UUID(str(original_id))
                except ValueError:
                    continue
                mapped = course_map.get(original_uuid)
                if mapped:
                    translated_assignments[str(mapped.id)] = container_id
            self.graph_repo.update(clone, container_assignments=translated_assignments)
        return clone
