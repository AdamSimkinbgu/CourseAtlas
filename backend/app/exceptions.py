"""Custom exception types for service and repository layers."""


class CourseAtlasError(Exception):
    """Base application error."""


class NotFoundError(CourseAtlasError):
    """Raised when an entity is not found."""


class ValidationError(CourseAtlasError):
    """Raised when business rules are violated."""


class PermissionError(CourseAtlasError):
    """Raised when the caller is not allowed to perform an action."""
