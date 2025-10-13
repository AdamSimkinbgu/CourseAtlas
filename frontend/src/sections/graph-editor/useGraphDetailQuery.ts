import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

export type GraphVisibility = "private" | "public";

export type GraphDetail = {
  graph: {
    id: string;
    title: string;
    description: string | null;
    visibility: GraphVisibility;
    is_template: boolean;
    updated_at: string;
    created_at: string;
    containers: GraphContainer[];
    container_assignments: Record<string, string>;
  };
  courses: CourseDetail[];
};

export type GraphContainer = {
  id: string;
  title: string;
  palette_id?: string | null;
  color: string;
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
};

export type CourseStatus = "planned" | "completed" | "failed";

export type CoursePrerequisite = {
  course_id: string;
  condition?: string | null;
};

export type CourseDetail = {
  id: string;
  graph_id: string;
  code: string;
  title: string;
  credits: number;
  term: string | null;
  status: CourseStatus;
  grade: string | null;
  is_pass_fail: boolean;
  position_x: number;
  position_y: number;
  notes: string | null;
  prerequisites: CoursePrerequisite[];
  created_at: string;
  updated_at: string;
};

async function fetchGraphDetail(graphId: string): Promise<GraphDetail> {
  const response = await api.get(`api/v1/graphs/${graphId}`);
  return response.json<GraphDetail>();
}

export function useGraphDetailQuery(graphId: string) {
  return useQuery({
    queryKey: ["graph", graphId],
    queryFn: () => fetchGraphDetail(graphId),
    enabled: Boolean(graphId),
    staleTime: 60 * 1000,
  });
}
