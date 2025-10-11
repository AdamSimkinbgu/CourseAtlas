"""Template API endpoints."""

from __future__ import annotations

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from typing_extensions import Annotated

from app.api.deps import get_template_service
from app.api.v1 import schemas
from app.core.security import get_current_user
from app.services.templates import TemplateService

TemplateServiceDep = Annotated[TemplateService, Depends(get_template_service)]
CurrentUser = Annotated[Any, Depends(get_current_user)]

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=List[schemas.TemplateRead])
async def list_templates(
    template_service: TemplateServiceDep,
    current_user: CurrentUser,
) -> List[schemas.TemplateRead]:
    views = template_service.list_public_templates()
    results: List[schemas.TemplateRead] = []
    for view in views:
        metadata = view.metadata
        results.append(
            schemas.TemplateRead(
                graph=schemas.GraphRead.model_validate(view.graph),
                tags=metadata.tags if metadata else [],
                summary=metadata.summary if metadata else None,
                preview_image_url=metadata.preview_image_url if metadata else None,
                published_at=metadata.published_at if metadata else None,
            )
        )
    return results


@router.post(
    "/{graph_id}/publish",
    response_model=schemas.TemplateRead,
    status_code=status.HTTP_201_CREATED,
)
async def publish_template(
    graph_id: UUID,
    payload: schemas.TemplatePublishRequest,
    template_service: TemplateServiceDep,
    current_user: CurrentUser,
) -> schemas.TemplateRead:
    view = template_service.publish_template(
        graph_id,
        tags=payload.tags,
        summary=payload.summary,
        preview_url=payload.preview_image_url,
    )
    metadata = view.metadata
    return schemas.TemplateRead(
        graph=schemas.GraphRead.model_validate(view.graph),
        tags=metadata.tags if metadata else [],
        summary=metadata.summary if metadata else None,
        preview_image_url=metadata.preview_image_url if metadata else None,
        published_at=metadata.published_at if metadata else None,
    )


@router.post(
    "/{template_id}/clone",
    response_model=schemas.GraphRead,
    status_code=status.HTTP_201_CREATED,
)
async def clone_template(
    template_id: UUID,
    template_service: TemplateServiceDep,
    current_user: CurrentUser,
) -> schemas.GraphRead:
    graph = template_service.clone_template(template_id, current_user.id)
    return schemas.GraphRead.model_validate(graph)
