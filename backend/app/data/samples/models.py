from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from app.domain.models import CourseStatus


class SamplePosition(BaseModel):
    x: float = 0.0
    y: float = 0.0


class SamplePrerequisite(BaseModel):
    course_id: str
    condition: Optional[str] = None


class SampleCourse(BaseModel):
    id: str
    code: str
    title: str
    credits: int = 0
    term: Optional[str] = None
    status: CourseStatus = CourseStatus.PLANNED
    grade: Optional[float] = None
    is_pass_fail: bool = False
    notes: Optional[str] = None
    prerequisites: List[SamplePrerequisite] = Field(default_factory=list)


class SampleContainer(BaseModel):
    id: str
    title: str
    palette_id: Optional[str] = None
    color: str = "#cbd5e1"
    width: Optional[float] = None
    height: Optional[float] = None
    position: Optional[SamplePosition] = None


class SampleGraph(BaseModel):
    title: str
    description: Optional[str] = None
    containers: List[SampleContainer] = Field(default_factory=list)
    container_assignments: Dict[str, str] = Field(default_factory=dict)
    container_order: Optional[List[str]] = None


class LayoutConfig(BaseModel):
    mode: str = "sample"
    container_order: Optional[List[str]] = None
    max_columns_per_container: int = 3
    containers_per_row: int = 4
    column_gap: float = 160.0
    row_gap: float = 200.0
    orphan_columns: int = 6


class SampleDefinition(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    graph: SampleGraph
    courses: List[SampleCourse]
    layout_config: LayoutConfig = Field(default_factory=LayoutConfig)

    def container_order(self) -> List[str]:
        if self.layout_config.container_order:
            return self.layout_config.container_order
        if self.graph.container_order:
            return self.graph.container_order
        return [container.id for container in self.graph.containers]
