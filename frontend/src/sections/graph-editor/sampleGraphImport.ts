import type { CourseDetail, CourseStatus } from "./useGraphDetailQuery";

export type ImportPrerequisitePayload = { course_id: string; condition: string | null };

export type ImportCoursePayload = {
  id: string;
  code: string;
  title: string;
  credits: number;
  term: string | null;
  status: CourseStatus;
  grade: number | null;
  is_pass_fail: boolean;
  position: { x: number; y: number };
  notes: string | null;
  prerequisites: ImportPrerequisitePayload[];
};

export type SampleGraphCourse = {
  id?: string;
  code: string;
  title: string;
  credits?: number;
  term?: string | null;
  status?: CourseStatus;
  grade?: number | string | null;
  is_pass_fail?: boolean;
  position?: { x?: number; y?: number };
  notes?: string | null;
  prerequisites?: Array<{ course_id: string; condition?: string | null }>;
};

export type SampleGraph = {
  graph: {
    title: string;
    description?: string | null;
    containers: Array<{
      id: string;
      title: string;
      palette_id?: string | null;
      color?: string;
      width?: number;
      height?: number;
      position?: { x?: number; y?: number };
    }>;
    container_assignments: Record<string, string>;
  };
  courses: SampleGraphCourse[];
};

export type NormalisedContainer = {
  id: string;
  title: string;
  palette_id?: string | null;
  color: string;
  width: number;
  height: number;
  position: { x: number; y: number };
};

type NormaliseCoursesResult = {
  courses: ImportCoursePayload[];
  idMap: Map<string, string>;
};

export function normaliseContainers(
  containers: SampleGraph["graph"]["containers"] | undefined,
  resolveColor: (paletteId?: string | null, fallback?: string) => string
): NormalisedContainer[] {
  return (containers ?? []).map((container) => ({
    id: container.id,
    title: container.title || "Group",
    palette_id: container.palette_id ?? null,
    color: container.color || resolveColor(container.palette_id ?? null),
    width: container.width ?? 320,
    height: container.height ?? 200,
    position: {
      x: container.position?.x ?? 0,
      y: container.position?.y ?? 0,
    },
  }));
}

export function normaliseCourses(
  courses: SampleGraphCourse[] | undefined,
  generateId: () => string
): NormaliseCoursesResult {
  const allowedStatuses: CourseStatus[] = ["planned", "completed", "failed"];
  const idMap = new Map<string, string>();

  type PendingCourse = {
    originalId: string;
    course: ImportCoursePayload & {
      prerequisites: Array<{ course_id: string; condition: string | null }>;
    };
  };

  const pending: PendingCourse[] = (courses ?? []).map((course) => {
    const originalId = course.id ?? course.code ?? generateId();
    const uuid = generateId();
    idMap.set(originalId, uuid);

    const rawStatus =
      typeof course.status === "string" ? (course.status.toLowerCase() as CourseStatus) : "planned";
    const status = allowedStatuses.includes(rawStatus) ? rawStatus : "planned";
    const gradeValue = course.grade;
    const numericGrade =
      gradeValue === null || gradeValue === undefined || gradeValue === ""
        ? null
        : Number(gradeValue);

    return {
      originalId,
      course: {
        id: uuid,
        code: course.code,
        title: course.title,
        credits: Math.max(0, Math.round(Number(course.credits ?? 0))),
        term: course.term ?? null,
        status,
        grade: Number.isFinite(numericGrade) ? Number(numericGrade) : null,
        is_pass_fail: Boolean(course.is_pass_fail),
        position: {
          x: Number(course.position?.x ?? 0),
          y: Number(course.position?.y ?? 0),
        },
        notes: course.notes ?? null,
        prerequisites: Array.isArray(course.prerequisites)
          ? course.prerequisites.map((item) => ({
              course_id: item.course_id,
              condition: item?.condition ?? null,
            }))
          : [],
      },
    };
  });

  pending.forEach((entry) => {
    entry.course.prerequisites = entry.course.prerequisites
      .map((item) => {
        const sourceId =
          item && typeof item.course_id === "string" ? idMap.get(item.course_id) : undefined;
        if (!sourceId) return null;
        return {
          course_id: sourceId,
          condition: item?.condition ?? null,
        };
      })
      .filter(Boolean) as Array<{ course_id: string; condition: string | null }>;
  });

  return {
    courses: pending.map((entry) => entry.course as ImportCoursePayload),
    idMap,
  };
}

export function buildAssignments(
  rawAssignments: Record<string, string>,
  idMap: Map<string, string>
): Record<string, string> {
  const assignments: Record<string, string> = {};
  Object.entries(rawAssignments).forEach(([courseId, containerId]) => {
    const mappedId = idMap.get(courseId);
    if (mappedId) {
      assignments[mappedId] = containerId;
    }
  });
  return assignments;
}

export function prepareSampleGraphImport(
  sample: SampleGraph,
  options: {
    generateId: () => string;
    resolveContainerColor: (paletteId?: string | null, fallback?: string) => string;
  }
): {
  containers: NormalisedContainer[];
  courses: ImportCoursePayload[];
  assignments: Record<string, string>;
} {
  const { courses, idMap } = normaliseCourses(sample.courses, options.generateId);
  const containers = normaliseContainers(sample.graph?.containers, options.resolveContainerColor);
  const rawAssignments = sample.graph?.container_assignments ?? {};
  const assignments = buildAssignments(rawAssignments, idMap);
  return {
    containers,
    courses,
    assignments,
  };
}

export type MultiSelectionGroup = {
  id: string;
  title: string;
  isSelected: boolean;
  courses: CourseDetail[];
  totalCourses: number;
};

type ContainerSummary = {
  title?: string | null;
};

export function buildMultiSelectionSummary(params: {
  courses: CourseDetail[];
  selectedCourseIds: string[];
  selectedContainerIds: string[];
  courseAssignments: Record<string, string>;
  containers: Map<string, ContainerSummary>;
}): { groups: MultiSelectionGroup[]; ungroupedCourses: CourseDetail[] } {
  const { courses, selectedCourseIds, selectedContainerIds, courseAssignments, containers } =
    params;

  const selectedCourses = selectedCourseIds
    .map((id) => courses.find((course) => course.id === id))
    .filter((course): course is CourseDetail => Boolean(course));

  const selectedContainerSet = new Set(selectedContainerIds);
  const groupMap = new Map<
    string,
    { container: ContainerSummary | undefined; isSelected: boolean; courses: CourseDetail[] }
  >();

  selectedContainerIds.forEach((id) => {
    groupMap.set(id, {
      container: containers.get(id),
      isSelected: true,
      courses: [],
    });
  });

  const ungrouped: CourseDetail[] = [];

  selectedCourses.forEach((course) => {
    const assignedContainerId = courseAssignments[course.id];
    if (assignedContainerId) {
      const entry = groupMap.get(assignedContainerId) ?? {
        container: containers.get(assignedContainerId),
        isSelected: selectedContainerSet.has(assignedContainerId),
        courses: [],
      };
      entry.courses.push(course);
      groupMap.set(assignedContainerId, entry);
    } else {
      ungrouped.push(course);
    }
  });

  const groups: MultiSelectionGroup[] = Array.from(groupMap.entries()).map(([id, entry]) => ({
    id,
    title: entry.container?.title ?? "Untitled container",
    isSelected: entry.isSelected,
    totalCourses: entry.courses.length,
    courses: entry.courses
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { sensitivity: "base" })),
  }));

  groups.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

  const sortedUngrouped = ungrouped.sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { sensitivity: "base" })
  );

  return { groups, ungroupedCourses: sortedUngrouped };
}
