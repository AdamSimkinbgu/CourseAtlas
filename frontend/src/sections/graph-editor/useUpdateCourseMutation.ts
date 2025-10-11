import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { CourseDetail } from "./useGraphDetailQuery";

export type UpdateCoursePayload = Partial<
  Pick<
    CourseDetail,
    | "title"
    | "code"
    | "credits"
    | "term"
    | "status"
    | "notes"
    | "position_x"
    | "position_y"
    | "grade"
    | "is_pass_fail"
  >
>;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", graphId] });
    },
  });
}
