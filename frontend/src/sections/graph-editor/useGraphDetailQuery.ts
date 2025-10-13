import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

export type GraphVisibility = "private" | "public";

type GraphDetailResponse = {
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

type CourseRaw = {
  id: string;
  graph_id: string;
  code: string;
  title: string;
  credits: number;
  term: string | null;
  status: CourseStatus;
  grade: string | null;
  is_pass_fail: boolean;
  position: {
    x: number;
    y: number;
  };
  notes: string | null;
  prerequisites: CoursePrerequisite[];
  created_at: string;
  updated_at: string;
};

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
  const data = (await response.json()) as {
    graph: GraphDetail["graph"];
    courses: CourseRaw[];
  };
  return {
    graph: data.graph,
    courses: data.courses.map((course) => ({
      id: course.id,
      graph_id: course.graph_id,
      code: course.code,
      title: course.title,
      credits: course.credits,
      term: course.term,
      status: course.status,
      grade: course.grade,
      is_pass_fail: course.is_pass_fail,
      position_x: course.position?.x ?? 0,
      position_y: course.position?.y ?? 0,
      notes: course.notes,
      prerequisites: course.prerequisites,
      created_at: course.created_at,
      updated_at: course.updated_at,
    })),
  };
}

export function useGraphDetailQuery(graphId: string) {
  return useQuery({
    queryKey: ["graph", graphId],
    queryFn: () => fetchGraphDetail(graphId),
    enabled: Boolean(graphId),
    staleTime: 60 * 1000,
  });
}
