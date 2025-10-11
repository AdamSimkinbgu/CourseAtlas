import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { CoursePrerequisite } from "./useGraphDetailQuery";

async function updatePrerequisites(
  courseId: string,
  prerequisites: CoursePrerequisite[]
): Promise<CoursePrerequisite[]> {
  const response = await api.put(`api/v1/courses/${courseId}/prerequisites`, {
    json: { items: prerequisites },
  });
  return response.json<CoursePrerequisite[]>();
}

export function useUpdatePrerequisitesMutation(graphId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      prerequisites,
    }: {
      courseId: string;
      prerequisites: CoursePrerequisite[];
    }) => updatePrerequisites(courseId, prerequisites),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", graphId] });
    },
  });
}
