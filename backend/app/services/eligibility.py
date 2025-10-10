"""Eligibility helper service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List
from uuid import UUID

from app.repositories.courses import CourseRepository


@dataclass
class EligibilityResult:
    eligible: bool
    reasons: List[str]


class EligibilityService:
    def __init__(self, course_repo: CourseRepository) -> None:
        self.course_repo = course_repo

    def check_course_eligibility(
        self, course_id: UUID, completed_course_ids: Iterable[UUID]
    ) -> EligibilityResult:
        course = self.course_repo.get(course_id)
        if course is None:
            return EligibilityResult(eligible=False, reasons=["Course not found"])

        completed = {UUID(str(cid)) for cid in completed_course_ids}
        reasons: List[str] = []
        for prereq in course.prerequisites:
            prereq_id = UUID(str(prereq.get("course_id")))
            if prereq_id not in completed:
                reasons.append(f"Missing prerequisite {prereq_id}")
        return EligibilityResult(eligible=not reasons, reasons=reasons)
