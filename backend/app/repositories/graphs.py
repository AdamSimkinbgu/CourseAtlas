"""Graph repository handling persistence for study plans."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlmodel import Session, select

from app.domain.models import Graph, TemplateMetadata


class GraphRepository:
    """Data access helpers for `Graph` and related aggregates."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, graph: Graph) -> Graph:
        self.session.add(graph)
        self.session.flush()
        self.session.refresh(graph)
        return graph

    def update(self, graph: Graph, **data: object) -> Graph:
        for key, value in data.items():
            setattr(graph, key, value)
        self.session.add(graph)
        self.session.flush()
        self.session.refresh(graph)
        return graph

    def get(self, graph_id: UUID) -> Optional[Graph]:
        return self.session.get(Graph, graph_id)

    def list_by_owner(self, owner_id: UUID) -> List[Graph]:
        statement = (
            select(Graph)
            .where(Graph.owner_id == owner_id)
            .order_by(Graph.created_at.desc())
        )
        return list(self.session.exec(statement))

    def duplicate(self, source_graph: Graph, *, new_owner_id: UUID) -> Graph:
        clone = Graph(
            owner_id=new_owner_id,
            title=f"{source_graph.title} (copy)",
            description=source_graph.description,
            is_template=False,
            visibility=source_graph.visibility,
            containers=list(source_graph.containers),
            container_assignments=dict(source_graph.container_assignments),
        )
        self.session.add(clone)
        self.session.flush()
        self.session.refresh(clone)
        # Courses duplicated externally by CourseRepository
        return clone

    def delete(self, graph: Graph) -> None:
        self.session.delete(graph)

    # Template metadata helpers -------------------------------------------------
    def list_public_templates(self) -> List[Graph]:
        statement = select(Graph).where(Graph.is_template.is_(True))
        return list(self.session.exec(statement))

    def create_template_metadata(
        self,
        template: TemplateMetadata,
    ) -> TemplateMetadata:
        self.session.add(template)
        self.session.flush()
        self.session.refresh(template)
        return template
