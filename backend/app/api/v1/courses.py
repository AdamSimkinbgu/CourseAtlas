"""Course API endpoints."""

from __future__ import annotations

import logging
from typing import Any, Dict, Tuple
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from typing_extensions import Annotated

from app.api.deps import get_course_service
from app.api.v1 import schemas
from app.core.security import get_current_user
from app.services.courses import CourseService

CourseServiceDep = Annotated[CourseService, Depends(get_course_service)]
CurrentUser = Annotated[Any, Depends(get_current_user)]

router = APIRouter(prefix="/courses", tags=["courses"])


def _to_course_read(course) -> schemas.CourseReadFormatted:
    return schemas.CourseReadFormatted(
        id=course.id,
        graph_id=course.graph_id,
        code=course.code,
        title=course.title,
        credits=course.credits,
        term=course.term,
        status=course.status,
        prerequisites=course.prerequisites,
        grade=course.grade,
        is_pass_fail=course.is_pass_fail,
        position=schemas.Position(x=course.position_x, y=course.position_y),
        notes=course.notes,
        created_at=course.created_at,
        updated_at=course.updated_at,
    )


@router.patch("/{course_id}", response_model=schemas.CourseReadFormatted)
async def update_course(
    course_id: UUID,
    payload: schemas.CourseUpdateRequest,
    course_service: CourseServiceDep,
    current_user: CurrentUser,
) -> schemas.CourseReadFormatted:
    data = payload.model_dump(exclude_none=True)
    position = data.pop("position", None)
    position_tuple: Tuple[float, float] | None = None

    if position is not None:
        if isinstance(position, dict):
            try:
                position_tuple = (float(position["x"]), float(position["y"]))
            except (KeyError, TypeError, ValueError) as exc:  # pragma: no cover
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid position payload; expected numeric x/y",
                ) from exc
        else:
            position_tuple = (position.x, position.y)  # type: ignore[attr-defined]
        data["position_x"], data["position_y"] = position_tuple

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No update fields provided"
        )

    updated = course_service.update_course(course_id, data)

    extra_debug: Dict[str, Any] = {}
    if position_tuple is not None:
        extra_debug["position"] = {
            "x": data.get("position_x"),
            "y": data.get("position_y"),
        }
    if extra_debug:
        logger.info("course_update %s %s", course_id, extra_debug)

    return _to_course_read(updated)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    course_service: CourseServiceDep,
    current_user: CurrentUser,
) -> None:
    course_service.delete_course(course_id)


@router.put("/{course_id}/prerequisites", response_model=schemas.CourseReadFormatted)
async def update_prerequisites(
    course_id: UUID,
    payload: schemas.PrerequisitesUpdate,
    course_service: CourseServiceDep,
    current_user: CurrentUser,
) -> schemas.CourseReadFormatted:
    updated = course_service.set_prerequisites(
        course_id,
        [item.model_dump() for item in payload.items],
    )
    return _to_course_read(updated)


@router.get("/{course_id}", response_model=schemas.CourseReadFormatted)
async def get_course(
    course_id: UUID,
    course_service: CourseServiceDep,
    current_user: CurrentUser,
) -> schemas.CourseReadFormatted:
    updated = course_service._get_course_or_error(course_id)  # type: ignore[attr-defined]
    return _to_course_read(updated)
logger = logging.getLogger("course-update")
