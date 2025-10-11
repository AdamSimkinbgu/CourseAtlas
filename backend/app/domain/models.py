"""Domain models for Course Atlas backend."""

from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Boolean, Column, Enum, ForeignKey, String, Text, text
from sqlmodel import Field, SQLModel


class Visibility(str, enum.Enum):
    PRIVATE = "private"
    PUBLIC = "public"


class CourseStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TimestampMixin(SQLModel):
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={
            "onupdate": datetime.utcnow,
            "server_default": text("CURRENT_TIMESTAMP"),
        },
    )


class User(TimestampMixin, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    email: str = Field(sa_column=Column(String(255), unique=True, nullable=False))
    display_name: str = Field(sa_column=Column(String(255), nullable=False))
    avatar_url: Optional[str] = Field(default=None, sa_column=Column(String(1024)))
    auth_provider_id: Optional[str] = Field(
        default=None,
        sa_column=Column(String(255), unique=True, nullable=True),
    )


class Graph(TimestampMixin, table=True):
    __tablename__ = "graphs"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    owner_id: UUID = Field(sa_column=Column(ForeignKey("users.id"), nullable=False))
    title: str = Field(sa_column=Column(String(255), nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_template: bool = Field(default=False, sa_column=Column(Boolean, nullable=False))
    visibility: Visibility = Field(
        default=Visibility.PRIVATE,
        sa_column=Column(Enum(Visibility, name="graph_visibility"), nullable=False),
    )


class Course(TimestampMixin, table=True):
    __tablename__ = "courses"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    graph_id: UUID = Field(sa_column=Column(ForeignKey("graphs.id"), nullable=False))
    code: str = Field(sa_column=Column(String(120), nullable=False))
    title: str = Field(sa_column=Column(String(255), nullable=False))
    credits: int = Field(nullable=False, ge=0)
    term: Optional[str] = Field(default=None, sa_column=Column(String(120)))
    status: CourseStatus = Field(
        default=CourseStatus.PLANNED,
        sa_column=Column(Enum(CourseStatus, name="course_status"), nullable=False),
    )
    prerequisites: List[dict] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False, server_default=text("'[]'")),
    )
    grade: Optional[Decimal] = None
    is_pass_fail: bool = Field(default=False, sa_column=Column(Boolean, nullable=False))
    position_x: float = Field(default=0.0)
    position_y: float = Field(default=0.0)
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class TemplateMetadata(TimestampMixin, table=True):
    __tablename__ = "template_metadata"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    graph_id: UUID = Field(sa_column=Column(ForeignKey("graphs.id"), nullable=False))
    tags: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False, server_default=text("'[]'")),
    )
    summary: Optional[str] = Field(default=None, sa_column=Column(Text))
    preview_image_url: Optional[str] = Field(
        default=None, sa_column=Column(String(1024))
    )
    published_at: Optional[datetime] = None
