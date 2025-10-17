import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

async function deleteCourse(courseId: string): Promise<void> {
  await api.delete(`api/v1/courses/${courseId}`);
}

export function useDeleteCourseMutation(graphId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", graphId] });
    },
  });
}
