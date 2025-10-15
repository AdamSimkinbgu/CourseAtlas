from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, List, Tuple

from app.data.samples.models import (
    LayoutConfig,
    SampleCourse,
    SampleDefinition,
    SamplePrerequisite,
)
from app.domain.models import CourseStatus

DEFAULT_COURSE_WIDTH = 280.0
DEFAULT_COURSE_HEIGHT = 170.0
TARGET_NODE_GAP = 48.0
DEFAULT_CONTAINER_MIN_WIDTH = 320.0
DEFAULT_CONTAINER_MIN_HEIGHT = 240.0
CONTAINER_HEADER_HEIGHT = 56.0
CONTAINER_PADDING = 48.0


@dataclass
class BuiltCourse:
    sample_id: str
    code: str
    title: str
    credits: int
    term: str | None
    status: CourseStatus
    grade: float | None
    is_pass_fail: bool
    notes: str | None
    position: Dict[str, float]
    prerequisites: List[SamplePrerequisite]


@dataclass
class LayoutResult:
    containers: List[Dict[str, object]]
    courses: List[BuiltCourse]
    assignments: Dict[str, str]
    preview: Dict[str, object]
    warnings: List[str]


def _compute_container_dimensions(
    course_count: int, config: LayoutConfig
) -> Tuple[float, float, int]:
    if course_count <= 0:
        return DEFAULT_CONTAINER_MIN_WIDTH, DEFAULT_CONTAINER_MIN_HEIGHT, 1

    columns = max(1, min(config.max_columns_per_container, course_count))
    rows = math.ceil(course_count / columns)

    padded_width = (
        CONTAINER_PADDING * 2
        + columns * DEFAULT_COURSE_WIDTH
        + (columns - 1) * TARGET_NODE_GAP
    )
    padded_height = (
        CONTAINER_PADDING * 2
        + CONTAINER_HEADER_HEIGHT
        + rows * DEFAULT_COURSE_HEIGHT
        + (rows - 1) * TARGET_NODE_GAP
    )

    width = max(DEFAULT_CONTAINER_MIN_WIDTH, padded_width)
    height = max(DEFAULT_CONTAINER_MIN_HEIGHT, padded_height)
    return width, height, columns


def _course_payload(course: SampleCourse, position: Dict[str, float]) -> BuiltCourse:
    grade = None
    if course.grade is not None:
        try:
            grade = float(course.grade)
        except (TypeError, ValueError):
            grade = None
    return BuiltCourse(
        sample_id=course.id,
        code=course.code,
        title=course.title,
        credits=max(0, int(course.credits)),
        term=course.term,
        status=course.status,
        grade=grade,
        is_pass_fail=bool(course.is_pass_fail),
        notes=course.notes,
        position={"x": float(position["x"]), "y": float(position["y"])},
        prerequisites=list(course.prerequisites),
    )


def _bounds(x: float, y: float, width: float, height: float) -> Dict[str, float]:
    return {"x": x, "y": y, "width": width, "height": height}


def _expand_bounds(
    aggregate: Dict[str, float] | None, rect: Dict[str, float]
) -> Dict[str, float]:
    if aggregate is None:
        return dict(rect)
    min_x = min(aggregate["x"], rect["x"])
    min_y = min(aggregate["y"], rect["y"])
    max_x = max(aggregate["x"] + aggregate["width"], rect["x"] + rect["width"])
    max_y = max(aggregate["y"] + aggregate["height"], rect["y"] + rect["height"])
    return {
        "x": min_x,
        "y": min_y,
        "width": max_x - min_x,
        "height": max_y - min_y,
    }


def build_sample_layout(sample: SampleDefinition) -> LayoutResult:
    config = sample.layout_config
    container_order = sample.container_order()

    container_map = {
        container.id: {
            "id": container.id,
            "title": container.title,
            "palette_id": container.palette_id,
            "color": container.color,
            "width": float(DEFAULT_CONTAINER_MIN_WIDTH),
            "height": float(DEFAULT_CONTAINER_MIN_HEIGHT),
            "position": {"x": 0.0, "y": 0.0},
        }
        for container in sample.graph.containers
    }

    courses_by_container: Dict[str, List[SampleCourse]] = {}
    orphan_courses: List[SampleCourse] = []

    for course in sample.courses:
        container_id = sample.graph.container_assignments.get(course.id)
        if container_id:
            courses_by_container.setdefault(container_id, []).append(course)
        else:
            orphan_courses.append(course)

    layout_entries: List[Tuple[str, float, float, int, List[SampleCourse]]] = []
    for container_id in container_order:
        container = container_map.get(container_id)
        if not container:
            continue
        members = courses_by_container.get(container_id, [])
        width, height, columns = _compute_container_dimensions(len(members), config)
        layout_entries.append(
            (container_id, width, height, columns, list(members))
        )

    max_container_width = (
        max((entry[1] for entry in layout_entries), default=DEFAULT_CONTAINER_MIN_WIDTH)
    )
    max_container_height = (
        max((entry[2] for entry in layout_entries), default=DEFAULT_CONTAINER_MIN_HEIGHT)
    )

    cursor_x = 0.0
    cursor_y = 0.0
    row_height = 0.0

    built_courses: List[BuiltCourse] = []
    assignments: Dict[str, str] = {}
    bounds: Dict[str, float] | None = None

    for index, (container_id, width, height, columns, members) in enumerate(
        layout_entries
    ):
        if index > 0 and index % config.containers_per_row == 0:
            cursor_x = 0.0
            cursor_y += row_height + config.row_gap
            row_height = 0.0

        container = container_map[container_id]
        container["position"] = {"x": cursor_x, "y": cursor_y}
        container["width"] = max(container["width"], width)
        container["height"] = max(container["height"], height)

        container_bounds = _bounds(
            container["position"]["x"],
            container["position"]["y"],
            container["width"],
            container["height"],
        )
        bounds = _expand_bounds(bounds, container_bounds)

        start_x = container["position"]["x"] + CONTAINER_PADDING
        start_y = (
            container["position"]["y"] + CONTAINER_PADDING + CONTAINER_HEADER_HEIGHT
        )

        for course_index, course in enumerate(members):
            column = course_index % columns
            row = course_index // columns
            position = {
                "x": start_x
                + column * (DEFAULT_COURSE_WIDTH + TARGET_NODE_GAP),
                "y": start_y + row * (DEFAULT_COURSE_HEIGHT + TARGET_NODE_GAP),
            }
            built_courses.append(_course_payload(course, position))
            assignments[course.id] = container_id
            course_bounds = _bounds(
                position["x"],
                position["y"],
                DEFAULT_COURSE_WIDTH,
                DEFAULT_COURSE_HEIGHT,
            )
            bounds = _expand_bounds(bounds, course_bounds)

        cursor_x += max(width, max_container_width) + config.column_gap
        row_height = max(row_height, max(height, max_container_height))

    if orphan_courses:
        orphan_base_y = cursor_y + row_height + config.row_gap
        for index, course in enumerate(orphan_courses):
            column = index % config.orphan_columns
            row = index // config.orphan_columns
            position = {
                "x": CONTAINER_PADDING
                + column * (DEFAULT_COURSE_WIDTH + TARGET_NODE_GAP),
                "y": orphan_base_y + row * (DEFAULT_COURSE_HEIGHT + TARGET_NODE_GAP),
            }
            built_courses.append(_course_payload(course, position))
            course_bounds = _bounds(
                position["x"],
                position["y"],
                DEFAULT_COURSE_WIDTH,
                DEFAULT_COURSE_HEIGHT,
            )
            bounds = _expand_bounds(bounds, course_bounds)

    ordered_containers = [container_map[cid] for cid in container_order if cid in container_map]
    other_containers = [
        container
        for cid, container in container_map.items()
        if cid not in container_order
    ]

    preview_containers = [
        {
            "id": container["id"],
            "position": dict(container["position"]),
            "width": container["width"],
            "height": container["height"],
        }
        for container in [*ordered_containers, *other_containers]
    ]
    preview_courses = [
        {
            "id": course.sample_id,
            "position": dict(course.position),
            "containerId": assignments.get(course.sample_id),
            "width": DEFAULT_COURSE_WIDTH,
            "height": DEFAULT_COURSE_HEIGHT,
        }
        for course in built_courses
    ]

    preview = {
        "bounds": bounds
        or {
            "x": 0.0,
            "y": 0.0,
            "width": DEFAULT_CONTAINER_MIN_WIDTH,
            "height": DEFAULT_CONTAINER_MIN_HEIGHT,
        },
        "courseCount": len(built_courses),
        "containerCount": len(container_map),
        "containers": preview_containers,
        "courses": preview_courses,
    }

    warnings = validate_layout(assignments, ordered_containers + other_containers, built_courses)

    return LayoutResult(
        containers=[*ordered_containers, *other_containers],
        courses=built_courses,
        assignments=assignments,
        preview=preview,
        warnings=warnings,
    )


def _rects_intersect(a: Dict[str, float], b: Dict[str, float]) -> bool:
    return not (
        a["x"] + a["width"] <= b["x"]
        or b["x"] + b["width"] <= a["x"]
        or a["y"] + a["height"] <= b["y"]
        or b["y"] + b["height"] <= a["y"]
    )


def validate_layout(
    assignments: Dict[str, str],
    containers: List[Dict[str, object]],
    courses: List[BuiltCourse],
) -> List[str]:
    warnings: List[str] = []
    container_lookup = {container["id"]: container for container in containers}

    # Collision detection
    for idx, course in enumerate(courses):
        course_bounds = _bounds(
            course.position["x"],
            course.position["y"],
            DEFAULT_COURSE_WIDTH,
            DEFAULT_COURSE_HEIGHT,
        )
        # Check course overlaps
        for other in courses[idx + 1 :]:
            other_bounds = _bounds(
                other.position["x"],
                other.position["y"],
                DEFAULT_COURSE_WIDTH,
                DEFAULT_COURSE_HEIGHT,
            )
            if _rects_intersect(course_bounds, other_bounds):
                warnings.append(
                    f"Collision detected between {course.sample_id} and {other.sample_id}"
                )

        container_id = assignments.get(course.sample_id)
        if not container_id:
            continue
        container = container_lookup.get(container_id)
        if not container:
            warnings.append(
                f"Course {course.sample_id} assigned to missing container {container_id}"
            )
            continue

        container_bounds = _bounds(
            container["position"]["x"] + CONTAINER_PADDING,
            container["position"]["y"] + CONTAINER_PADDING + CONTAINER_HEADER_HEIGHT,
            container["width"] - CONTAINER_PADDING * 2,
            container["height"] - (CONTAINER_PADDING * 2 + CONTAINER_HEADER_HEIGHT),
        )

        if not (
            container_bounds["x"]
            <= course_bounds["x"]
            <= container_bounds["x"] + container_bounds["width"] - DEFAULT_COURSE_WIDTH
            and container_bounds["y"]
            <= course_bounds["y"]
            <= container_bounds["y"] + container_bounds["height"] - DEFAULT_COURSE_HEIGHT
        ):
            warnings.append(
                f"Course {course.sample_id} sits outside container {container_id} bounds"
            )

    return warnings
