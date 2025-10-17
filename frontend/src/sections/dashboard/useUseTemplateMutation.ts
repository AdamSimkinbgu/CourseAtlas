import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { GraphSummary } from "./useGraphsQuery";

async function useTemplate(templateId: string): Promise<GraphSummary> {
  const response = await api.post(`api/v1/templates/${templateId}/clone`);
  return response.json<GraphSummary>();
}

export function useUseTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: useTemplate,
    onSuccess: (graph) => {
      queryClient.setQueryData<GraphSummary[]>(["graphs"], (existing) => {
        if (!existing) return [graph];
        return [graph, ...existing];
      });
    },
  });
}
