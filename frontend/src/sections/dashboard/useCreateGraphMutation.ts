import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { GraphSummary } from "./useGraphsQuery";

type CreateGraphPayload = {
  title: string;
  description: string;
};

type CreateGraphResponse = GraphSummary;

async function createGraph(payload: CreateGraphPayload): Promise<CreateGraphResponse> {
  const response = await api.post("api/v1/graphs", {
    json: payload,
  });
  return response.json<CreateGraphResponse>();
}

export function useCreateGraphMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGraph,
    onSuccess: (graph) => {
      queryClient.setQueryData<GraphSummary[]>(["graphs"], (existing) => {
        if (!existing) return [graph];
        return [graph, ...existing];
      });
    },
  });
}
