"""Repository abstractions wrapping database access."""

from .courses import CourseRepository
from .graphs import GraphRepository
from .templates import TemplateRepository
from .users import UserRepository

__all__ = [
    "CourseRepository",
    "GraphRepository",
    "TemplateRepository",
    "UserRepository",
]
