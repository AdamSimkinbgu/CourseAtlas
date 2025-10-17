"""Pydantic schemas for API requests and responses."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.models import CourseStatus, Visibility


class GraphCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    visibility: Optional[Visibility] = None
    containers: Optional[List["GraphContainer"]] = None
    container_assignments: Optional[Dict[str, str]] = None


class GraphUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[Visibility] = None
    containers: Optional[List["GraphContainer"]] = None
    container_assignments: Optional[Dict[str, str]] = None


class GraphDuplicateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[Visibility] = None


class GraphRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str]
    is_template: bool
    visibility: Visibility
    created_at: datetime
    updated_at: datetime
    containers: List["GraphContainer"] = Field(default_factory=list)
    container_assignments: Dict[str, str] = Field(default_factory=dict)


class Position(BaseModel):
    x: float
    y: float


class PrerequisiteItem(BaseModel):
    course_id: UUID
    condition: Optional[str] = None


class CourseCreateRequest(BaseModel):
    code: str
    title: str
    credits: int
    term: Optional[str] = None
    status: CourseStatus = CourseStatus.PLANNED
    position: Position = Field(default_factory=lambda: Position(x=0.0, y=0.0))
    is_pass_fail: bool = False
    notes: Optional[str] = None


class CourseUpdateRequest(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    credits: Optional[int] = None
    term: Optional[str] = None
    status: Optional[CourseStatus] = None
    grade: Optional[Decimal] = None
    is_pass_fail: Optional[bool] = None
    position: Optional[Position] = None
    notes: Optional[str] = None


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    graph_id: UUID
    code: str
    title: str
    credits: int
    term: Optional[str]
    status: CourseStatus
    prerequisites: List[dict]
    grade: Optional[Decimal]
    is_pass_fail: bool
    position_x: float
    position_y: float
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class CourseReadFormatted(BaseModel):
    id: UUID
    graph_id: UUID
    code: str
    title: str
    credits: int
    term: Optional[str]
    status: CourseStatus
    prerequisites: List[dict]
    grade: Optional[Decimal]
    is_pass_fail: bool
    position: Position
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class GraphWithCourses(BaseModel):
    graph: GraphRead
    courses: List[CourseReadFormatted]


class PrerequisitesUpdate(BaseModel):
    items: List[PrerequisiteItem]


class TemplatePublishRequest(BaseModel):
    tags: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    preview_image_url: Optional[str] = None


class TemplateRead(BaseModel):
    graph: GraphRead
    tags: List[str] = Field(default_factory=list)
    summary: Optional[str]
    preview_image_url: Optional[str]
    published_at: Optional[datetime]


class TemplateCloneResponse(BaseModel):
    graph: GraphRead


class GraphExportResponse(BaseModel):
    data: dict


class GraphImportRequest(BaseModel):
    containers: List["GraphContainer"] = Field(default_factory=list)
    container_assignments: Dict[str, str] = Field(default_factory=dict)
    courses: List["GraphImportCourse"]
    replace_existing: bool = False


class GraphContainer(BaseModel):
    id: str
    title: str
    palette_id: Optional[str] = None
    color: str
    width: float
    height: float
    position: Position


class GraphImportCourse(BaseModel):
    id: Optional[str] = None
    code: str
    title: str
    credits: int
    term: Optional[str] = None
    status: CourseStatus = CourseStatus.PLANNED
    grade: Optional[Decimal] = None
    is_pass_fail: bool = False
    position: Position = Field(default_factory=lambda: Position(x=0.0, y=0.0))
    notes: Optional[str] = None
    prerequisites: List[PrerequisiteItem] = Field(default_factory=list)


GraphRead.model_rebuild()
