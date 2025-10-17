import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

export type TemplateSummary = {
  graph: {
    id: string;
    title: string;
    description: string | null;
  };
  tags: string[];
  summary: string | null;
  preview_image_url: string | null;
  published_at: string | null;
};

async function fetchTemplates(): Promise<TemplateSummary[]> {
  const response = await api.get("api/v1/templates");
  return response.json<TemplateSummary[]>();
}

export function useTemplatesQuery() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
    staleTime: 10 * 60 * 1000,
  });
}
