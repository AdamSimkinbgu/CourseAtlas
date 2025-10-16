import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { CourseDetail, GraphDetail } from "./useGraphDetailQuery";

type EditableCourseFields = Pick<
  CourseDetail,
  "title" | "code" | "credits" | "term" | "status" | "notes" | "grade" | "is_pass_fail"
>;

export type UpdateCoursePayload = Partial<EditableCourseFields> & {
  position?: { x: number; y: number };
};

async function updateCourse(courseId: string, payload: UpdateCoursePayload): Promise<CourseDetail> {
  const response = await api.patch(`api/v1/courses/${courseId}`, {
    json: payload,
  });
  return response.json<CourseDetail>();
}

export function useUpdateCourseMutation(graphId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: UpdateCoursePayload }) =>
      updateCourse(courseId, data),
    onSuccess: (updated, variables) => {
      // Only update cache for non-position updates to avoid triggering re-renders during drag
      // Position updates are handled optimistically in the drag handler
      if (!variables.data.position) {
        queryClient.setQueryData<GraphDetail | undefined>(["graph", graphId], (previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            courses: previous.courses.map((course) =>
              course.id === updated.id ? { ...course, ...updated } : course
            ),
          };
        });
      }
    },
  });
}
