import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { GraphSummary } from "./useGraphsQuery";

type DuplicateResponse = GraphSummary;

async function duplicateGraph(graphId: string): Promise<DuplicateResponse> {
  const response = await api.post(`api/v1/graphs/${graphId}/duplicate`);
  return response.json<DuplicateResponse>();
}

export function useDuplicateGraphMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateGraph,
    onSuccess: (graph) => {
      queryClient.setQueryData<GraphSummary[]>(["graphs"], (existing) => {
        if (!existing) return [graph];
        return [graph, ...existing];
      });
    },
  });
}
