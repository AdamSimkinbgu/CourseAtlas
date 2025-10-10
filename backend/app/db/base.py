"""Database base metadata placeholder."""

from sqlmodel import SQLModel

from app.domain.models import Course, Graph, TemplateMetadata, User

__all__ = ["SQLModel", "User", "Graph", "Course", "TemplateMetadata"]
