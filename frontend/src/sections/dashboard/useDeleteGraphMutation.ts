import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { GraphSummary } from "./useGraphsQuery";

async function deleteGraph(graphId: string): Promise<void> {
  await api.delete(`api/v1/graphs/${graphId}`);
}

export function useDeleteGraphMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGraph,
    onSuccess: (_data, graphId) => {
      queryClient.setQueryData<GraphSummary[]>(["graphs"], (existing) => {
        if (!existing) return existing;
        return existing.filter((graph) => graph.id !== graphId);
      });
    },
  });
}
