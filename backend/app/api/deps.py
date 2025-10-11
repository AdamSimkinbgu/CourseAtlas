"""Dependency providers for API routers."""

from fastapi import Depends
from sqlmodel import Session
from typing_extensions import Annotated

from app.db.session import get_session
from app.repositories.courses import CourseRepository
from app.repositories.graphs import GraphRepository
from app.repositories.templates import TemplateRepository
from app.repositories.users import UserRepository
from app.services.courses import CourseService
from app.services.graphs import GraphService
from app.services.templates import TemplateService
from app.services.users import UserService

SessionDep = Annotated[Session, Depends(get_session)]


def get_graph_service(session: SessionDep) -> GraphService:
    graph_repo = GraphRepository(session)
    course_repo = CourseRepository(session)
    return GraphService(graph_repo, course_repo)


def get_course_service(session: SessionDep) -> CourseService:
    graph_repo = GraphRepository(session)
    course_repo = CourseRepository(session)
    return CourseService(course_repo, graph_repo)


def get_template_service(session: SessionDep) -> TemplateService:
    graph_repo = GraphRepository(session)
    course_repo = CourseRepository(session)
    template_repo = TemplateRepository(session)
    return TemplateService(graph_repo, course_repo, template_repo)


def get_user_service(session: SessionDep) -> UserService:
    return UserService(UserRepository(session))
