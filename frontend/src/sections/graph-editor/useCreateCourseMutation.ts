import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

type CreateCoursePayload = {
  code: string;
  title: string;
  credits: number;
  term?: string | null;
  status?: string;
  is_pass_fail?: boolean;
  notes?: string | null;
};

export function useCreateCourseMutation(graphId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCoursePayload) => {
      const response = await api.post(`api/v1/graphs/${graphId}/courses`, {
        json: payload,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", graphId] });
      queryClient.invalidateQueries({ queryKey: ["graphs"] });
    },
  });
}
