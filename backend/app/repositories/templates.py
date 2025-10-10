"""Template repository utilities."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlmodel import Session, select

from app.domain.models import Graph, TemplateMetadata


class TemplateRepository:
    """Data access for template metadata."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_metadata(self, template_id: UUID) -> Optional[TemplateMetadata]:
        return self.session.get(TemplateMetadata, template_id)

    def list_public_graphs(self) -> list[Graph]:
        statement = select(Graph).where(Graph.is_template.is_(True))
        return list(self.session.exec(statement))

    def save_metadata(self, metadata: TemplateMetadata) -> TemplateMetadata:
        self.session.add(metadata)
        self.session.flush()
        self.session.refresh(metadata)
        return metadata
