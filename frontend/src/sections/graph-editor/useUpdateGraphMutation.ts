import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

type UpdateGraphPayload = {
  containers?: Array<{
    id: string;
    title: string;
    color: string;
    width: number;
    height: number;
    position: { x: number; y: number };
  }>;
  container_assignments?: Record<string, string>;
  title?: string;
  description?: string | null;
  visibility?: string;
};

export function useUpdateGraphMutation(graphId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateGraphPayload) => {
      if (!graphId) return;
      await api.patch(`api/v1/graphs/${graphId}`, {
        json: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", graphId] });
      queryClient.invalidateQueries({ queryKey: ["graphs"] });
    },
  });
}
