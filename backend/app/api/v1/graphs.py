"""Graph API endpoints."""

from __future__ import annotations

from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from typing_extensions import Annotated

from app.api.deps import get_course_service, get_graph_service
from app.api.v1 import schemas
from app.core.security import get_current_user
from app.services.courses import CourseCreate, CourseService
from app.services.graphs import GraphCreate, GraphService

CourseServiceDep = Annotated[CourseService, Depends(get_course_service)]
GraphServiceDep = Annotated[GraphService, Depends(get_graph_service)]
CurrentUser = Annotated[Any, Depends(get_current_user)]

router = APIRouter(prefix="/graphs", tags=["graphs"])


def _to_graph_read(graph) -> schemas.GraphRead:
    return schemas.GraphRead.model_validate(graph)


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


@router.get("/", response_model=List[schemas.GraphRead])
async def list_graphs(
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> List[schemas.GraphRead]:
    graphs = graph_service.list_graphs(current_user.id)
    return [_to_graph_read(graph) for graph in graphs]


@router.post(
    "/",
    response_model=schemas.GraphRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_graph(
    payload: schemas.GraphCreateRequest,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> schemas.GraphRead:
    graph = graph_service.create_graph(
        GraphCreate(
            owner_id=current_user.id,
            title=payload.title,
            description=payload.description,
            visibility=payload.visibility,
        )
    )
    return _to_graph_read(graph)


@router.get("/{graph_id}", response_model=schemas.GraphWithCourses)
async def get_graph(
    graph_id: UUID,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> schemas.GraphWithCourses:
    graph, courses = graph_service.get_graph_with_courses(
        graph_id, requesting_user=current_user.id
    )
    return schemas.GraphWithCourses(
        graph=_to_graph_read(graph),
        courses=[_to_course_read(course) for course in courses],
    )


@router.patch("/{graph_id}", response_model=schemas.GraphRead)
async def update_graph(
    graph_id: UUID,
    payload: schemas.GraphUpdateRequest,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> schemas.GraphRead:
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided"
        )
    graph = graph_service.update_graph(graph_id, data, requesting_user=current_user.id)
    return _to_graph_read(graph)


@router.delete("/{graph_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_graph(
    graph_id: UUID,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> None:
    graph_service.delete_graph(graph_id, requesting_user=current_user.id)


@router.post("/{graph_id}/duplicate", response_model=schemas.GraphRead)
async def duplicate_graph(
    graph_id: UUID,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
    payload: Optional[schemas.GraphDuplicateRequest] = None,
) -> schemas.GraphRead:
    clone = graph_service.duplicate_graph(graph_id, new_owner_id=current_user.id)
    if payload:
        data = payload.model_dump(exclude_none=True)
        if "visibility" in data and data["visibility"] is None:
            data.pop("visibility")
        if data:
            clone = graph_service.update_graph(
                clone.id, data, requesting_user=current_user.id
            )
    return _to_graph_read(clone)


@router.get("/{graph_id}/courses", response_model=List[schemas.CourseReadFormatted])
async def list_courses_for_graph(
    graph_id: UUID,
    course_service: CourseServiceDep,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> List[schemas.CourseReadFormatted]:
    graph_service.get_graph(graph_id, requesting_user=current_user.id)
    courses = course_service.list_courses_for_graph(graph_id)
    return [_to_course_read(course) for course in courses]


@router.post(
    "/{graph_id}/courses",
    response_model=schemas.CourseReadFormatted,
    status_code=status.HTTP_201_CREATED,
)
async def add_course_to_graph(
    graph_id: UUID,
    payload: schemas.CourseCreateRequest,
    course_service: CourseServiceDep,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> schemas.CourseReadFormatted:
    graph_service.get_graph(graph_id, requesting_user=current_user.id)
    created = course_service.add_course(
        CourseCreate(
            graph_id=graph_id,
            code=payload.code,
            title=payload.title,
            credits=payload.credits,
            term=payload.term,
            status=payload.status,
            position_x=payload.position.x,
            position_y=payload.position.y,
            is_pass_fail=payload.is_pass_fail,
            notes=payload.notes,
        )
    )
    return _to_course_read(created)


@router.post("/{graph_id}/export", response_model=dict)
async def export_graph(
    graph_id: UUID,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> dict:
    return graph_service.export_graph(graph_id, requesting_user=current_user.id)


@router.post("/{graph_id}/import", status_code=status.HTTP_202_ACCEPTED)
async def import_graph_data(
    graph_id: UUID,
    payload: schemas.GraphImportRequest,
    course_service: CourseServiceDep,
    graph_service: GraphServiceDep,
    current_user: CurrentUser,
) -> dict:
    graph_service.get_graph(graph_id, requesting_user=current_user.id)
    if payload.replace_existing:
        course_service.delete_courses_for_graph(graph_id)
    created = course_service.add_courses_bulk(
        graph_id,
        [
            CourseCreate(
                graph_id=graph_id,
                code=course.code,
                title=course.title,
                credits=course.credits,
                term=course.term,
                status=course.status,
                position_x=course.position.x,
                position_y=course.position.y,
                is_pass_fail=course.is_pass_fail,
                notes=course.notes,
            )
            for course in payload.courses
        ],
    )
    return {"imported": len(created)}
