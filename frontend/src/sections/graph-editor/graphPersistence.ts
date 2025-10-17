import type { GraphDetail } from "./useGraphDetailQuery";

export type AssignmentsMap = Record<string, string>;

type EnqueueMutation = (task: () => Promise<void>) => Promise<void>;

type AssignmentsMutation = {
  mutateAsync: (payload: { container_assignments: AssignmentsMap }) => Promise<unknown>;
};

export function sanitizeAssignments(
  assignments: AssignmentsMap,
  validCourseIds: Set<string>
): AssignmentsMap {
  const sanitized: AssignmentsMap = {};
  for (const [courseId, containerId] of Object.entries(assignments)) {
    if (typeof containerId === "string" && containerId && validCourseIds.has(courseId)) {
      sanitized[courseId] = containerId;
    }
  }
  return sanitized;
}

export function createAssignmentsPersistence(options: {
  graphId?: string;
  enqueueMutation: EnqueueMutation;
  updateGraphCache: (updater: (draft: GraphDetail) => void) => () => void;
  updateGraphMutation: AssignmentsMutation;
}) {
  const { graphId, enqueueMutation, updateGraphCache, updateGraphMutation } = options;

  return async function persistAssignments(
    assignments: AssignmentsMap,
    validCourseIds: Set<string>
  ) {
    if (!graphId) return;
    const sanitized = sanitizeAssignments(assignments, validCourseIds);
    const rollback = updateGraphCache((draft) => {
      draft.graph.container_assignments = { ...sanitized };
    });
    await enqueueMutation(async () => {
      try {
        await updateGraphMutation.mutateAsync({ container_assignments: sanitized });
      } catch (error) {
        console.error("Failed to persist assignments", error);
        rollback();
        throw error;
      }
    });
  };
}

export function cloneGraphDetail(detail: GraphDetail): GraphDetail {
  return {
    graph: {
      ...detail.graph,
      containers: detail.graph.containers.map((container) => ({ ...container })),
      container_assignments: { ...detail.graph.container_assignments },
    },
    courses: detail.courses.map((course) => ({ ...course })),
  };
}
