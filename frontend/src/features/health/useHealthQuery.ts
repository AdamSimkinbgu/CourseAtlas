import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

export type HealthResponse = {
  status: string;
};

async function fetchHealth(): Promise<HealthResponse> {
  return api.get("healthz").json<HealthResponse>();
}

export function useHealthQuery() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });
}
