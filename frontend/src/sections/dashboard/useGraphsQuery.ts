import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

export type GraphSummary = {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
};

async function fetchGraphs(): Promise<GraphSummary[]> {
  const response = await api.get("api/v1/graphs");
  return response.json<GraphSummary[]>();
}

export function useGraphsQuery() {
  return useQuery({
    queryKey: ["graphs"],
    queryFn: fetchGraphs,
    staleTime: 5 * 60 * 1000,
  });
}
