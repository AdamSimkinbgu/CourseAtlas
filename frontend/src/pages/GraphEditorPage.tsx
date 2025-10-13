import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Position,
  Handle,
  addEdge,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  NodeProps,
  NodeResizer,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { api } from "../lib/api";
import { useHealthQuery } from "../features/health/useHealthQuery";
import {
  type CourseDetail,
  type CoursePrerequisite,
  type CourseStatus,
  useGraphDetailQuery,
} from "../sections/graph-editor/useGraphDetailQuery";
import { useCreateCourseMutation } from "../sections/graph-editor/useCreateCourseMutation";
import { useUpdateCourseMutation } from "../sections/graph-editor/useUpdateCourseMutation";
import { useUpdatePrerequisitesMutation } from "../sections/graph-editor/useUpdatePrerequisitesMutation";
import { useDeleteCourseMutation } from "../sections/graph-editor/useDeleteCourseMutation";
import { useUpdateGraphMutation } from "../sections/graph-editor/useUpdateGraphMutation";
import { Skeleton } from "../components/Skeleton";
import {
  CONTAINER_PALETTE,
  GRADE_PASS_THRESHOLD,
  THEME_TOKENS,
  type ContainerPaletteColor,
  type StatusKey,
} from "../styles/tokens";
import smallSampleRaw from "../fixtures/smallSampleGraph.json";
import largeSampleRaw from "../fixtures/largeSampleGraph.json";

type EditorNodeData = CourseNodeData | ContainerNodeData;

type CourseNodeData = {
  kind: "course";
  course: CourseDetail;
  hasUnmetPrereqs: boolean;
  onSelect: (courseId: string) => void;
  theme: ThemeMode;
  isSelected: boolean;
  isPrerequisiteHighlight: boolean;
};

type ContainerNodeData = {
  kind: "container";
  container: ContainerShape;
  onSelect: (containerId: string) => void;
  theme: ThemeMode;
  courseCount: number;
};

type ContainerShape = {
  id: string;
  title: string;
  palette_id?: string | null;
  color: string;
  width: number;
  height: number;
  position: { x: number; y: number };
};

type ThemeMode = "light" | "dark";

type HistoryEntry = {
  nodes: Node<EditorNodeData>[];
  edges: Edge[];
  assignments: Record<string, string>;
};

const PALETTE_BY_ID = new Map<string, ContainerPaletteColor>(
  CONTAINER_PALETTE.map((entry) => [entry.id, entry])
);

const CONTAINER_NODE_SHADOW: Record<ThemeMode, string> = {
  light: "inset 0 0 0 1px rgba(15,23,42,0.04), 0 20px 55px -32px rgba(15,23,42,0.25)",
  dark: "inset 0 0 0 1px rgba(148,163,184,0.18), 0 24px 60px -32px rgba(2,6,23,0.85)",
};

const DEFAULT_CONTAINER_FALLBACK = {
  light: {
    fill: "transparent",
    border: "#cbd5e1",
    shadow: CONTAINER_NODE_SHADOW.light,
  },
  dark: {
    fill: "transparent",
    border: "#475569",
    shadow: CONTAINER_NODE_SHADOW.dark,
  },
};

type SampleGraphCourse = {
  id?: string;
  code: string;
  title: string;
  credits?: number;
  term?: string | null;
  status?: CourseStatus;
  grade?: number | string | null;
  is_pass_fail?: boolean;
  position?: { x?: number; y?: number };
  notes?: string | null;
  prerequisites?: Array<{ course_id: string; condition?: string | null }>;
};

type SampleGraph = {
  graph: {
    title: string;
    description?: string | null;
    containers: Array<{
      id: string;
      title: string;
      palette_id?: string | null;
      color?: string;
      width?: number;
      height?: number;
      position?: { x?: number; y?: number };
    }>;
    container_assignments: Record<string, string>;
  };
  courses: SampleGraphCourse[];
};

const smallSample = smallSampleRaw as SampleGraph;
const largeSample = largeSampleRaw as SampleGraph;

function resolveContainerVisuals(
  container: ContainerShape,
  theme: ThemeMode
): { fill: string; border: string; shadow: string } {
  const paletteId = container.palette_id ?? undefined;
  const paletteEntry = paletteId ? PALETTE_BY_ID.get(paletteId) : undefined;
  if (paletteEntry) {
    return theme === "dark"
      ? {
          fill: paletteEntry.dark.fill,
          border: paletteEntry.dark.border,
          shadow: CONTAINER_NODE_SHADOW.dark,
        }
      : {
          fill: paletteEntry.light.fill,
          border: paletteEntry.light.border,
          shadow: CONTAINER_NODE_SHADOW.light,
        };
  }
  const fallbackFill = container.color;
  if (fallbackFill) {
    return theme === "dark"
      ? {
          fill: fallbackFill,
          border: DEFAULT_CONTAINER_FALLBACK.dark.border,
          shadow: DEFAULT_CONTAINER_FALLBACK.dark.shadow,
        }
      : {
          fill: fallbackFill,
          border: DEFAULT_CONTAINER_FALLBACK.light.border,
          shadow: DEFAULT_CONTAINER_FALLBACK.light.shadow,
        };
  }
  return theme === "dark" ? DEFAULT_CONTAINER_FALLBACK.dark : DEFAULT_CONTAINER_FALLBACK.light;
}

function storedContainerColor(paletteId?: string | null, fallback?: string): string {
  const entry = paletteId ? PALETTE_BY_ID.get(paletteId) : undefined;
  if (entry) {
    return entry.light.fill;
  }
  return fallback ?? DEFAULT_CONTAINER_FALLBACK.light.fill;
}

type CourseNodeProps = NodeProps<CourseNodeData>;

function CourseNode({ data }: CourseNodeProps) {
  const { course, hasUnmetPrereqs, onSelect, theme, isSelected, isPrerequisiteHighlight } = data;

  const themeTokens = THEME_TOKENS[theme];
  const statusKey: StatusKey = (() => {
    if (hasUnmetPrereqs) return "blocked";
    if (course.status === "completed") return "completed";
    if (course.status === "failed") return "failed";
    return "planned";
  })();
  const statusToken = themeTokens.status[statusKey];

  const baseShadow =
    theme === "dark"
      ? "0 24px 55px -32px rgba(2,6,23,0.85)"
      : "0 20px 45px -30px rgba(15,23,42,0.28)";
  const haloShadow = isSelected
    ? `0 0 0 4px ${themeTokens.halo.active}`
    : isPrerequisiteHighlight
      ? `0 0 0 3px ${themeTokens.halo.prerequisite}`
      : "none";
  const combinedShadow = haloShadow === "none" ? baseShadow : `${haloShadow}, ${baseShadow}`;

  const displayStatus =
    course.status.charAt(0).toUpperCase() + course.status.slice(1).replace("_", " ");
  const gradeBadge = course.grade ? Number(course.grade).toFixed(0) : null;
  const prereqCount = course.prerequisites.length;
  const metaChips = [
    `${course.credits} credit${course.credits === 1 ? "" : "s"}`,
    course.term ? course.term : "Term TBD",
    course.is_pass_fail ? "Pass / Fail" : "Graded",
    prereqCount ? `${prereqCount} prereq${prereqCount === 1 ? "" : "s"}` : "No prereqs",
  ];

  return (
    <div
      className="group relative w-72 cursor-pointer rounded-2xl border p-5 text-left transition"
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55)) , ${statusToken.bg}`,
        color: statusToken.text,
        borderColor: statusToken.border,
        boxShadow: combinedShadow,
        opacity: hasUnmetPrereqs && statusKey === "blocked" ? 0.78 : 1,
      }}
      onDoubleClick={() => onSelect(course.id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border !border-slate-300 !bg-white shadow-sm dark:!border-slate-600 dark:!bg-slate-950"
        style={{ top: "50%", transform: "translate(-50%, -50%)" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border !border-slate-300 !bg-white shadow-sm dark:!border-slate-600 dark:!bg-slate-950"
        style={{ top: "50%", transform: "translate(50%, -50%)" }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500/80 dark:text-slate-200/80">
            {course.code}
          </span>
          <h3 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100">
            {course.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {gradeBadge ? (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm dark:bg-slate-900/60 dark:text-slate-100">
              {gradeBadge}
            </span>
          ) : null}
          <span className="rounded-full border border-white/40 bg-white/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/90 shadow-sm dark:border-slate-500/40 dark:bg-slate-800/70">
            {displayStatus}
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
        {metaChips.map((chip, index) => (
          <div
            key={`${chip}-${index}`}
            className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-2 py-1 shadow-sm dark:border-slate-500/50 dark:bg-slate-900/40"
          >
            <span className="font-medium text-slate-700 dark:text-slate-200">{chip}</span>
          </div>
        ))}
      </div>
      {hasUnmetPrereqs ? (
        <p className="mt-3 rounded-md border border-amber-400/40 bg-amber-400/10 p-2 text-xs font-medium text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          Prerequisites not met — course blocked
        </p>
      ) : null}
    </div>
  );
}

type ContainerNodeProps = NodeProps<ContainerNodeData>;

function ContainerNode({ data, selected }: ContainerNodeProps) {
  const { container, onSelect, theme, courseCount } = data;
  const visual = resolveContainerVisuals(container, theme);
  return (
    <div
      className="group relative h-full w-full rounded-3xl border border-dashed transition"
      style={{
        backgroundColor: visual.fill,
        borderColor: visual.border,
        boxShadow: selected
          ? `0 0 0 3px ${THEME_TOKENS[theme].halo.active}, ${visual.shadow}`
          : visual.shadow,
      }}
      onDoubleClick={() => onSelect(container.id)}
    >
      <NodeResizer
        minWidth={280}
        minHeight={220}
        isVisible={selected}
        lineClassName="border border-dashed border-slate-400/50 dark:border-slate-500/40"
        handleClassName="h-3 w-3 rounded-sm border border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-950"
      />
      <div className="pointer-events-none flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-100">
        <span className="text-lg font-semibold">{container.title}</span>
        <span className="rounded-full border border-current px-2 py-0.5 text-[11px] font-medium uppercase text-slate-500 dark:text-slate-300">
          {courseCount === 1 ? "1 course" : `${courseCount} courses`}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = {
  course: CourseNode,
  container: ContainerNode,
};

const THEME_STORAGE_KEY = "course-atlas-theme";

function randomId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random()}`;
}

function cloneNodes(nodes: Node<EditorNodeData>[]): Node<EditorNodeData>[] {
  return nodes.map((node) => ({
    ...node,
    data: { ...node.data },
    position: { ...node.position },
    style: node.style ? { ...node.style } : undefined,
  }));
}

function cloneEdges(edges: Edge[]): Edge[] {
  return edges.map((edge) => ({ ...edge }));
}

export function GraphEditorPage() {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const detailQuery = useGraphDetailQuery(graphId ?? "");
  const updateCourseMutation = useUpdateCourseMutation(graphId ?? "");
  const updatePrerequisitesMutation = useUpdatePrerequisitesMutation(graphId ?? "");
  const deleteCourseMutation = useDeleteCourseMutation(graphId ?? "");
  const createCourseMutation = useCreateCourseMutation(graphId ?? "");
  const healthQuery = useHealthQuery();

  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    return stored ?? "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<EditorNodeData>([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);

  const initialViewportIsLarge =
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches;
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLargeViewport, setIsLargeViewport] = useState(initialViewportIsLarge);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDetailBubbleOpen, setIsDetailBubbleOpen] = useState(initialViewportIsLarge);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGraphActionsOpen, setIsGraphActionsOpen] = useState(false);

  const [courseAssignments, setCourseAssignments] = useState<Record<string, string>>({});

  const historyRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);

  const nodesRef = useRef<Node<EditorNodeData>[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const assignmentsRef = useRef<Record<string, string>>(courseAssignments);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    assignmentsRef.current = courseAssignments;
  }, [courseAssignments]);

  const openInspectorForCourse = useCallback(
    (courseId: string) => {
      setSelectedCourseId(courseId);
      setSelectedContainerId(null);
      if (!isLargeViewport) {
        setIsInspectorOpen(true);
      }
    },
    [isLargeViewport]
  );

  const openInspectorForContainer = useCallback(
    (containerId: string) => {
      setSelectedContainerId(containerId);
      setSelectedCourseId(null);
      if (!isLargeViewport) {
        setIsInspectorOpen(true);
      }
    },
    [isLargeViewport]
  );

  const closeInspector = useCallback(() => {
    setSelectedCourseId(null);
    setSelectedContainerId(null);
    setIsMenuOpen(false);
    setIsDetailBubbleOpen(false);
    if (!isLargeViewport) {
      setIsInspectorOpen(false);
    }
  }, [isLargeViewport]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const applyViewport = (matches: boolean) => {
      setIsLargeViewport(matches);
      setIsInspectorOpen(false);
      setIsDetailBubbleOpen(matches);
    };
    applyViewport(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => {
      applyViewport(event.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId && !selectedContainerId) {
      setIsMenuOpen(false);
      if (!isLargeViewport) {
        setIsDetailBubbleOpen(false);
      }
    } else if (isLargeViewport) {
      setIsDetailBubbleOpen(true);
    }
  }, [isLargeViewport, selectedContainerId, selectedCourseId]);

  const pushHistory = useCallback(() => {
    const snapshot: HistoryEntry = {
      nodes: cloneNodes(nodesRef.current),
      edges: cloneEdges(edgesRef.current),
      assignments: { ...assignmentsRef.current },
    };
    historyRef.current = [...historyRef.current.slice(-19), snapshot];
    futureRef.current = [];
  }, []);

  const serializeContainersFromNodes = useCallback((): ContainerShape[] => {
    return nodesRef.current
      .filter((node) => node.type === "container")
      .map((node) => {
        const data = node.data as ContainerNodeData;
        return {
          id: node.id,
          title: data.container.title,
          palette_id: data.container.palette_id ?? null,
          color: storedContainerColor(data.container.palette_id ?? null, data.container.color),
          width: typeof node.style?.width === "number" ? node.style.width : data.container.width,
          height:
            typeof node.style?.height === "number" ? node.style.height : data.container.height,
          position: node.position,
        };
      });
  }, []);

  const updateGraphMutation = useUpdateGraphMutation(graphId ?? "");

  const persistContainers = useCallback(() => {
    if (!graphId) return;
    const serialized = serializeContainersFromNodes();
    updateGraphMutation.mutate({ containers: serialized });
  }, [graphId, serializeContainersFromNodes, updateGraphMutation]);

  const persistAssignments = useCallback(
    (assignments: Record<string, string>) => {
      if (!graphId) return;
      updateGraphMutation.mutate({ container_assignments: assignments });
    },
    [graphId, updateGraphMutation]
  );

  const normaliseContainers = useCallback(
    (containers: SampleGraph["graph"]["containers"] | undefined) =>
      (containers ?? []).map((container) => ({
        id: container.id,
        title: container.title || "Group",
        color: container.color || storedContainerColor(container.palette_id ?? null),
        width: container.width ?? 320,
        height: container.height ?? 200,
        position: {
          x: container.position?.x ?? 0,
          y: container.position?.y ?? 0,
        },
      })),
    []
  );

  const normaliseCourses = useCallback((courses: SampleGraphCourse[] | undefined) => {
    const allowedStatuses: StatusKey[] = ["planned", "completed", "failed", "blocked"];
    return (courses ?? []).map((course) => {
      const rawStatus = typeof course.status === "string" ? course.status.toLowerCase() : "planned";
      const status = allowedStatuses.includes(rawStatus as StatusKey)
        ? (rawStatus as CourseStatus)
        : ("planned" as CourseStatus);
      const gradeValue = course.grade;
      const grade =
        gradeValue === null || gradeValue === undefined || gradeValue === ""
          ? null
          : Number(gradeValue);
      return {
        id: course.id ?? undefined,
        code: course.code,
        title: course.title,
        credits: Number(course.credits ?? 0),
        term: course.term ?? null,
        status,
        grade: Number.isFinite(grade) ? grade : null,
        is_pass_fail: Boolean(course.is_pass_fail),
        position: {
          x: Number(course.position?.x ?? 0),
          y: Number(course.position?.y ?? 0),
        },
        notes: course.notes ?? null,
        prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
      };
    });
  }, []);

  const submitImportPayload = useCallback(
    async (payload: {
      replace_existing: boolean;
      containers: ReturnType<typeof normaliseContainers>;
      container_assignments: Record<string, string>;
      courses: ReturnType<typeof normaliseCourses>;
    }) => {
      if (!graphId) return;
      await api.post(`api/v1/graphs/${graphId}/import`, {
        json: payload,
      });
      await detailQuery.refetch();
      setSelectedCourseId(null);
      setSelectedContainerId(null);
    },
    [detailQuery, graphId]
  );

  const applySampleGraph = useCallback(
    async (sample: SampleGraph) => {
      if (!graphId) return;
      try {
        setIsImporting(true);
        const payload = {
          replace_existing: true,
          containers: normaliseContainers(sample.graph?.containers),
          container_assignments: sample.graph?.container_assignments ?? {},
          courses: normaliseCourses(sample.courses),
        };
        await submitImportPayload(payload);
      } catch (error) {
        console.error("Failed to apply sample graph", error);
        alert("Unable to load sample graph. Please try again.");
      } finally {
        setIsImporting(false);
      }
    },
    [graphId, normaliseContainers, normaliseCourses, submitImportPayload]
  );

  useEffect(() => {
    if (!detailQuery.data) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const initialAssignments = detailQuery.data.graph.container_assignments ?? {};
    setCourseAssignments(initialAssignments);
    assignmentsRef.current = initialAssignments;

    const membersByContainer = new Map<string, CourseDetail[]>();
    const coursesList = detailQuery.data.courses;
    for (const course of coursesList) {
      const containerId = courseAssignments[course.id];
      if (!containerId) continue;
      const list = membersByContainer.get(containerId);
      if (list) {
        list.push(course);
      } else {
        membersByContainer.set(containerId, [course]);
      }
    }

    const containerNodes: Node<ContainerNodeData>[] = detailQuery.data.graph.containers.map(
      (container) => {
        const normalized: ContainerShape = {
          id: container.id,
          title: container.title,
          palette_id: container.palette_id ?? null,
          color: container.color,
          width: container.width ?? 320,
          height: container.height ?? 200,
          position: {
            x: Number.isFinite(container.position?.x) ? container.position.x : 0,
            y: Number.isFinite(container.position?.y) ? container.position.y : 0,
          },
        };
        const visuals = resolveContainerVisuals(normalized, theme);
        return {
          id: normalized.id,
          type: "container" as const,
          position: normalized.position,
          data: {
            kind: "container" as const,
            container: normalized,
            onSelect: openInspectorForContainer,
            theme,
            courseCount: membersByContainer.get(container.id)?.length ?? 0,
          },
          style: {
            width: normalized.width,
            height: normalized.height,
            zIndex: 0,
            backgroundColor: visuals.fill,
            borderColor: visuals.border,
          },
          draggable: true,
          selectable: true,
        } satisfies Node<ContainerNodeData>;
      }
    );
    const courses = detailQuery.data.courses;

    const selectedCourse = courses.find((course) => course.id === selectedCourseId);
    const prerequisiteSet = new Set(
      selectedCourse?.prerequisites.map((item) => item.course_id) ?? []
    );

    const courseNodes: Node<CourseNodeData>[] = courses.map((course) => {
      const assignments = initialAssignments;
      const parent = assignments[course.id];
      const hasUnmetPrereqs = course.prerequisites.some((item) => {
        const prereq = courses.find((candidate) => candidate.id === item.course_id);
        return !prereq || prereq.status !== "completed";
      });

      return {
        id: course.id,
        type: "course",
        position: {
          x: Number.isFinite(course.position_x) ? course.position_x : 0,
          y: Number.isFinite(course.position_y) ? course.position_y : 0,
        },
        data: {
          kind: "course",
          course,
          hasUnmetPrereqs,
          onSelect: openInspectorForCourse,
          theme,
          isSelected: selectedCourseId === course.id,
          isPrerequisiteHighlight: prerequisiteSet.has(course.id),
        },
        parentNode: parent,
        extent: parent ? "parent" : undefined,
        style: { zIndex: 1 },
        draggable: true,
        selectable: true,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    const edgesList: Edge[] = [];
    courses.forEach((course) => {
      course.prerequisites.forEach((prereq) => {
        const prereqCourse = courses.find((candidate) => candidate.id === prereq.course_id);
        const unmet = !prereqCourse || prereqCourse.status !== "completed";
        edgesList.push({
          id: `${prereq.course_id}->${course.id}`,
          source: prereq.course_id,
          target: course.id,
          type: "smoothstep",
          animated: !unmet,
          style: { stroke: unmet ? "#f97316" : "#94a3b8" },
        });
      });
    });

    setNodes([...containerNodes, ...courseNodes]);
    setEdges(edgesList);
    historyRef.current = [];
    futureRef.current = [];
    pushHistory();
  }, [
    courseAssignments,
    detailQuery.data,
    openInspectorForContainer,
    openInspectorForCourse,
    pushHistory,
    selectedCourseId,
    setEdges,
    setNodes,
    theme,
  ]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeInternal(changes);
      const affectsContainer = changes.some(
        (change) =>
          change.type === "dimensions" &&
          nodesRef.current.some(
            (candidate) => candidate.id === change.id && candidate.type === "container"
          )
      );
      if (affectsContainer) {
        setTimeout(() => persistContainers(), 0);
      }
    },
    [onNodesChangeInternal, persistContainers]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeInternal(changes);
    },
    [onEdgesChangeInternal]
  );

  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const { nodes: selectedNodes, edges: selectedEdges } = params;
      if (selectedNodes.length === 1) {
        const node = selectedNodes[0];
        if (node.type === "course") {
          openInspectorForCourse(node.id);
        } else if (node.type === "container") {
          openInspectorForContainer(node.id);
        }
      } else {
        closeInspector();
      }
      setSelectedEdgeIds(selectedEdges.map((edge) => edge.id));
    },
    [closeInspector, openInspectorForContainer, openInspectorForCourse]
  );

  const reactFlowToolbarActions = useMemo(
    () => ({
      undo: () => {
        if (historyRef.current.length === 0) return;
        const previous = historyRef.current[historyRef.current.length - 1];
        futureRef.current = [
          {
            nodes: cloneNodes(nodesRef.current),
            edges: cloneEdges(edgesRef.current),
            assignments: { ...assignmentsRef.current },
          },
          ...futureRef.current,
        ].slice(0, 20);
        historyRef.current = historyRef.current.slice(0, -1);
        setCourseAssignments(previous.assignments);
        setNodes(previous.nodes);
        setEdges(previous.edges);
        setTimeout(() => {
          persistAssignments(previous.assignments);
          persistContainers();
        }, 0);
      },
      redo: () => {
        if (futureRef.current.length === 0) return;
        const next = futureRef.current[0];
        historyRef.current = [
          ...historyRef.current,
          {
            nodes: cloneNodes(nodesRef.current),
            edges: cloneEdges(edgesRef.current),
            assignments: { ...assignmentsRef.current },
          },
        ].slice(-20);
        futureRef.current = futureRef.current.slice(1);
        setCourseAssignments(next.assignments);
        setNodes(next.nodes);
        setEdges(next.edges);
        setTimeout(() => {
          persistAssignments(next.assignments);
          persistContainers();
        }, 0);
      },
    }),
    [persistAssignments, persistContainers, setCourseAssignments, setEdges, setNodes]
  );

  const handleNodeDragStop = useCallback(
    async (_: unknown, node: Node<EditorNodeData>) => {
      if (node.type === "container") {
        setTimeout(() => {
          pushHistory();
          persistContainers();
        }, 0);
        return;
      }
      if (node.type !== "course") {
        pushHistory();
        return;
      }
      const { id, position } = node;
      try {
        await updateCourseMutation.mutateAsync({
          courseId: id,
          data: {
            position_x: position.x,
            position_y: position.y,
          },
        });
        setTimeout(() => pushHistory(), 0);
      } catch (error) {
        console.error("Failed to persist position", error);
      }
    },
    [persistContainers, pushHistory, updateCourseMutation]
  );

  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const courses = detailQuery.data?.courses ?? [];
      const targetCourse = courses.find((course) => course.id === connection.target);
      if (!targetCourse) return;
      const existing = targetCourse.prerequisites ?? [];
      if (existing.some((item) => item.course_id === connection.source)) return;

      const nextPrereqs: CoursePrerequisite[] = [...existing, { course_id: connection.source }];
      setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds));
      try {
        await updatePrerequisitesMutation.mutateAsync({
          courseId: targetCourse.id,
          prerequisites: nextPrereqs,
        });
        setTimeout(() => pushHistory(), 0);
      } catch (error) {
        console.error("Failed to add prerequisite", error);
        setEdges((eds) =>
          eds.filter((edge) => edge.id !== `${connection.source}->${connection.target}`)
        );
      }
    },
    [detailQuery.data?.courses, pushHistory, setEdges, updatePrerequisitesMutation]
  );

  const handleEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      const courses = detailQuery.data?.courses ?? [];
      const tasks = edgesToDelete.map(async (edge) => {
        const targetCourse = courses.find((course) => course.id === edge.target);
        if (!targetCourse) return;
        const filtered = (targetCourse.prerequisites ?? []).filter(
          (item) => item.course_id !== edge.source
        );
        try {
          await updatePrerequisitesMutation.mutateAsync({
            courseId: targetCourse.id,
            prerequisites: filtered,
          });
        } catch (error) {
          console.error("Failed to remove prerequisite", error);
        }
      });
      await Promise.all(tasks);
      setTimeout(() => pushHistory(), 0);
    },
    [detailQuery.data?.courses, pushHistory, updatePrerequisitesMutation]
  );

  const handleAssignContainer = useCallback(
    (courseId: string, containerId: string | "") => {
      setCourseAssignments((prev) => {
        const next = { ...prev };
        if (!containerId) {
          delete next[courseId];
        } else {
          next[courseId] = containerId;
        }
        persistAssignments(next);
        return next;
      });
      setNodes((nds) =>
        nds.map((node) =>
          node.id === courseId
            ? {
                ...node,
                parentNode: containerId || undefined,
                extent: containerId ? "parent" : undefined,
              }
            : node
        )
      );
      setTimeout(() => pushHistory(), 0);
    },
    [persistAssignments, pushHistory, setNodes]
  );

  const handleAddContainer = useCallback(() => {
    const newId = randomId();
    const existingContainers = nodesRef.current.filter((node) => node.type === "container");
    const nextIndex = existingContainers.length + 1;
    const palette = CONTAINER_PALETTE[Math.floor(Math.random() * CONTAINER_PALETTE.length)];
    const container: ContainerShape = {
      id: newId,
      title: `Group ${nextIndex}`,
      palette_id: palette.id,
      color: palette.light.fill,
      width: 320,
      height: 200,
      position: {
        x: existingContainers.length * 40,
        y: existingContainers.length * 40,
      },
    };
    const visuals = resolveContainerVisuals(container, theme);
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "container",
        position: container.position,
        data: {
          kind: "container",
          container,
          onSelect: openInspectorForContainer,
          theme,
        },
        style: {
          width: container.width,
          height: container.height,
          zIndex: 0,
          backgroundColor: visuals.fill,
          borderColor: visuals.border,
        },
        draggable: true,
        selectable: true,
      },
    ]);
    setTimeout(() => {
      pushHistory();
      persistContainers();
    }, 0);
  }, [openInspectorForContainer, persistContainers, pushHistory, setNodes, theme]);

  const handleUpdateContainer = useCallback(
    (containerId: string, updates: Partial<ContainerShape>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== containerId || node.type !== "container") {
            return node;
          }
          const data = node.data as ContainerNodeData;
          const merged: ContainerShape = {
            ...data.container,
            ...updates,
          };
          if (updates.palette_id !== undefined) {
            merged.palette_id = updates.palette_id;
            merged.color = storedContainerColor(updates.palette_id, merged.color);
          }
          const visuals = resolveContainerVisuals(merged, theme);
          return {
            ...node,
            data: {
              ...data,
              container: merged,
            },
            style: {
              ...node.style,
              backgroundColor: visuals.fill,
              borderColor: visuals.border,
            },
          };
        })
      );
      setTimeout(() => {
        pushHistory();
        persistContainers();
      }, 0);
    },
    [persistContainers, pushHistory, setNodes, theme]
  );

  const handleDeleteSelection = useCallback(async () => {
    const selectedNodes = nodesRef.current.filter((node) => node.selected);
    let removedContainer = false;
    for (const node of selectedNodes) {
      if (node.type === "course") {
        try {
          await deleteCourseMutation.mutateAsync(node.id);
        } catch (error) {
          console.error("Failed to delete course", error);
        }
      }
      if (node.type === "container") {
        const containerId = node.id;
        setCourseAssignments((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((courseId) => {
            if (next[courseId] === containerId) {
              delete next[courseId];
            }
          });
          persistAssignments(next);
          return next;
        });
        setNodes((nds) => nds.filter((candidate) => candidate.id !== containerId));
        removedContainer = true;
      }
    }
    if (selectedNodes.some((node) => node.type === "course")) {
      detailQuery.refetch();
    }
    if (selectedEdgeIds.length > 0) {
      const edgesToDelete = edgesRef.current.filter((edge) => selectedEdgeIds.includes(edge.id));
      await handleEdgesDelete(edgesToDelete);
      setEdges((eds) => eds.filter((edge) => !selectedEdgeIds.includes(edge.id)));
    }
    closeInspector();
    setTimeout(() => {
      pushHistory();
      if (removedContainer) {
        persistContainers();
      }
    }, 0);
  }, [
    closeInspector,
    deleteCourseMutation,
    detailQuery,
    handleEdgesDelete,
    persistAssignments,
    persistContainers,
    pushHistory,
    selectedEdgeIds,
    setEdges,
    setNodes,
  ]);

  const handleExportGraph = useCallback(async () => {
    if (!graphId) return;
    try {
      setIsExporting(true);
      const response = await api.post(`api/v1/graphs/${graphId}/export`);
      const payload = await response.json();
      const filenameBase = detailQuery.data?.graph.title?.trim() || graphId;
      const safeName = filenameBase
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `graph-${safeName || "export"}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export graph", error);
      alert("Unable to export graph. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [detailQuery.data?.graph.title, graphId]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!graphId) return;
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        setIsImporting(true);
        const text = await file.text();
        const parsed = JSON.parse(text) as Partial<SampleGraph>;
        const replaceExisting = window.confirm("Replace existing courses with the imported data?");
        const payload = {
          replace_existing: replaceExisting,
          containers: normaliseContainers(parsed.graph?.containers),
          container_assignments: parsed.graph?.container_assignments ?? {},
          courses: normaliseCourses(parsed.courses),
        };

        await submitImportPayload(payload);
        setSelectedCourseId(null);
        setSelectedContainerId(null);
      } catch (error) {
        console.error("Failed to import graph", error);
        alert("Import failed. Ensure the file was exported from Course Atlas and try again.");
      } finally {
        setIsImporting(false);
      }
    },
    [graphId, normaliseContainers, normaliseCourses, submitImportPayload]
  );

  const handleResetSmallSample = useCallback(() => {
    void applySampleGraph(smallSample);
  }, [applySampleGraph]);

  const handleResetLargeSample = useCallback(() => {
    void applySampleGraph(largeSample);
  }, [applySampleGraph]);

  const handleAutoLayoutAll = useCallback(() => {
    const instance = reactFlowInstanceRef.current;
    if (!instance) return;
    const padding = isLargeViewport ? 0.2 : 0.4;
    instance.fitView({ padding, duration: 400 });
    // TODO: Replace with real auto-layout algorithm (e.g., Dagre) in future iteration.
  }, [isLargeViewport]);

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleCreateCourse = useCallback(
    async (data: AddCourseFormState) => {
      if (!graphId) return;
      const code = data.code.trim();
      const title = data.title.trim();
      if (!code || !title) {
        alert("Course code and title are required.");
        return;
      }
      const creditsValue = Number(data.credits);
      if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
        alert("Credits must be a positive number.");
        return;
      }
      try {
        await createCourseMutation.mutateAsync({
          code,
          title,
          credits: Math.round(creditsValue),
          term: data.term.trim() || null,
          status: data.status,
          is_pass_fail: data.is_pass_fail,
          notes: data.notes.trim() ? data.notes.trim() : null,
        });
        setIsAddCourseOpen(false);
      } catch (error) {
        console.error("Failed to create course", error);
        alert("Unable to create course. Please try again.");
      }
    },
    [createCourseMutation, graphId]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // if (event.key === "Delete") {  // causes backspace to close menus instead of deleting
      //   event.preventDefault();
      //   handleDeleteSelection();
      // }
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsDetailBubbleOpen(false);
        setIsGraphActionsOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        reactFlowToolbarActions.undo();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        reactFlowToolbarActions.redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelection, reactFlowToolbarActions]);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    const courseNode = nodesRef.current.find(
      (node) => node.id === selectedCourseId && node.type === "course"
    );
    return (courseNode?.data as CourseNodeData | undefined)?.course ?? null;
  }, [selectedCourseId]);

  const selectedContainer = useMemo(() => {
    if (!selectedContainerId) return null;
    const containerNode = nodesRef.current.find(
      (node) => node.id === selectedContainerId && node.type === "container"
    );
    return (containerNode?.data as ContainerNodeData | undefined)?.container ?? null;
  }, [selectedContainerId]);

  const containerOptions = useMemo(() => {
    return nodes
      .filter((node) => node.type === "container")
      .map((node) => ({
        id: node.id,
        title: (node.data as ContainerNodeData).container.title,
      }));
  }, [nodes]);

  const containerMembers = useMemo(() => {
    const mapping = new Map<string, CourseDetail[]>();
    const courses = detailQuery.data?.courses ?? [];
    for (const course of courses) {
      const containerId = courseAssignments[course.id];
      if (!containerId) continue;
      const current = mapping.get(containerId);
      if (current) {
        current.push(course);
      } else {
        mapping.set(containerId, [course]);
      }
    }
    return mapping;
  }, [courseAssignments, detailQuery.data?.courses]);

  const { data: healthData, isLoading: healthLoading, isError: healthError } = healthQuery;
  const healthStatusLabel = healthLoading
    ? "Checking backend…"
    : healthError
      ? "Backend unreachable"
      : `Backend: ${healthData?.status ?? "ok"}`;

  const healthBadgeClasses =
    theme === "dark"
      ? healthError
        ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : healthError
        ? "border-rose-500/30 bg-rose-50 text-rose-700"
        : "border-emerald-500/30 bg-emerald-50 text-emerald-700";

  const healthDotClasses =
    theme === "dark"
      ? healthError
        ? "bg-rose-400"
        : "bg-emerald-400"
      : healthError
        ? "bg-rose-500"
        : "bg-emerald-500";

  const placeholderPanel =
    theme === "dark" ? (
      <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/60 p-6 text-sm text-slate-400">
        Select a course or container to view its details. Use the action bubble to open editing
        tools.
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/90 p-6 text-sm text-slate-600">
        Select a course or container to view its details. Use the action bubble to open editing
        tools.
      </div>
    );

  const inspectorContent = selectedCourse ? (
    <CourseSidePanel
      course={selectedCourse}
      assignedContainerId={courseAssignments[selectedCourse.id]}
      onChange={handleAssignContainer}
      containerOptions={containerOptions}
      onClose={closeInspector}
    />
  ) : selectedContainer ? (
    <ContainerSidePanel
      container={selectedContainer}
      members={containerMembers.get(selectedContainer.id) ?? []}
      theme={theme}
      onChange={handleUpdateContainer}
      onClose={closeInspector}
    />
  ) : (
    placeholderPanel
  );

  const workspaceClasses = "relative flex flex-1 min-h-[calc(100vh-8rem)] flex-col";

  const inspectorShellClasses =
    theme === "dark"
      ? "flex h-full w-full flex-col gap-5 overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 text-slate-100 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)]"
      : "flex h-full w-full flex-col gap-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl";
  const inspectorBubbleClasses =
    theme === "dark"
      ? "rounded-3xl border border-slate-800/70 bg-slate-950/85 p-4 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.85)] backdrop-blur"
      : "rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.25)] backdrop-blur";

  const canvasMinZoom = isLargeViewport ? 0.55 : 0.35;
  const canvasFitViewPadding = isLargeViewport ? 0.2 : 0.4;
  const hasSelection = Boolean(selectedCourse || selectedContainer);
  const canOpenInspector = hasSelection;
  const graphTitle = detailQuery.data?.graph.title ?? "Untitled graph";
  const selectedContainerMemberCount = selectedContainer
    ? (containerMembers.get(selectedContainer.id) ?? []).length
    : 0;
  const infoBubbleClasses =
    theme === "dark"
      ? "rounded-2xl border border-emerald-400/50 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),rgba(15,23,42,0.85))] px-5 py-4 text-slate-50 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.9)] backdrop-blur"
      : "rounded-2xl border border-emerald-300 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),white)] px-5 py-4 text-slate-900 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.18)] backdrop-blur";
  const menuButtonClasses =
    theme === "dark"
      ? "rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-slate-200 shadow-[0_12px_36px_-25px_rgba(15,23,42,0.75)] transition hover:bg-slate-900"
      : "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-600 shadow-[0_12px_36px_-25px_rgba(15,23,42,0.18)] transition hover:bg-slate-50";
  const menuPanelClasses =
    theme === "dark"
      ? "absolute left-full top-0 ml-3 w-52 rounded-2xl border border-slate-800/60 bg-slate-950/85 p-3 text-slate-100 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.88)]"
      : "absolute left-full top-0 ml-3 w-52 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.22)]";
  const graphActionsButtonClasses =
    theme === "dark"
      ? "rounded-full border border-blue-400/40 bg-[linear-gradient(135deg,rgba(59,130,246,0.28),rgba(59,130,246,0.1))] px-4 py-2 text-sm font-semibold text-slate-50 shadow-[0_25px_60px_-35px_rgba(30,64,175,0.7)] transition hover:bg-[rgba(59,130,246,0.32)]"
      : "rounded-full border border-blue-300 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),white)] px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_20px_50px_-30px_rgba(30,64,175,0.25)] transition hover:bg-[rgba(191,219,254,0.45)]";
  const graphActionPanelClasses =
    theme === "dark"
      ? "flex flex-col gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/85 p-3 text-sm text-slate-100 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.9)] backdrop-blur"
      : "flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.24)] backdrop-blur";
  const menuItemClasses =
    theme === "dark"
      ? "w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-900/70 focus:outline-none"
      : "w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus:outline-none";
  const menuItemDangerClasses =
    theme === "dark" ? "text-rose-300 hover:bg-rose-500/10" : "text-rose-600 hover:bg-rose-50";
  const graphActionItemClasses =
    theme === "dark"
      ? "rounded-full bg-slate-900/70 px-4 py-2 text-left text-slate-200 transition hover:bg-slate-900 focus:outline-none"
      : "rounded-full bg-white px-4 py-2 text-left text-slate-700 transition hover:bg-slate-100 focus:outline-none";
  const infoBubbleContent = hasSelection ? (
    selectedCourse ? (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
          Course selected
        </p>
        <h2 className="mt-3 text-xl font-semibold">{selectedCourse.code}</h2>
        <p className="mt-1 text-sm text-slate-400">{selectedCourse.title}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>{selectedCourse.credits} credits</span>
          <span>Status: {selectedCourse.status}</span>
        </div>
      </div>
    ) : (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
          Container selected
        </p>
        <h2 className="mt-3 text-xl font-semibold">{selectedContainer?.title}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {selectedContainerMemberCount} course{selectedContainerMemberCount === 1 ? "" : "s"}
        </p>
      </div>
    )
  ) : (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
        Course graph
      </p>
      <h1 className="mt-3 text-2xl font-semibold">{graphTitle}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Drag nodes, connect prerequisites, and group courses into containers. Select an element to
        access its quick actions.
      </p>
      <span
        className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${healthBadgeClasses}`}
      >
        <span className={`h-2 w-2 rounded-full ${healthDotClasses}`} />
        {healthStatusLabel}
      </span>
    </div>
  );

  const menuItems: Array<{ label: string; action: () => void; danger?: boolean }> = [];
  if (selectedCourse) {
    menuItems.push({
      label: "Open details",
      action: () => {
        if (isLargeViewport) {
          setIsDetailBubbleOpen(true);
        } else {
          setIsInspectorOpen(true);
        }
        setIsMenuOpen(false);
      },
    });
    menuItems.push({
      label: "Delete course",
      action: () => {
        void handleDeleteSelection().finally(() => {
          setIsMenuOpen(false);
          setIsDetailBubbleOpen(false);
        });
      },
      danger: true,
    });
  } else if (selectedContainer) {
    menuItems.push({
      label: "Open details",
      action: () => {
        if (isLargeViewport) {
          setIsDetailBubbleOpen(true);
        } else {
          setIsInspectorOpen(true);
        }
        setIsMenuOpen(false);
      },
    });
    menuItems.push({
      label: "Delete container",
      action: () => {
        void handleDeleteSelection().finally(() => {
          setIsMenuOpen(false);
          setIsDetailBubbleOpen(false);
        });
      },
      danger: true,
    });
  }
  if (hasSelection) {
    menuItems.push({
      label: "Deselect",
      action: () => {
        setIsMenuOpen(false);
        closeInspector();
      },
    });
  }

  const graphActionItems = useMemo(
    () => [
      {
        label: "Add course",
        disabled: false,
        action: () => {
          setIsAddCourseOpen(true);
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Add container",
        disabled: false,
        action: () => {
          handleAddContainer();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: isImporting ? "Importing…" : "Import JSON",
        disabled: isImporting,
        action: () => {
          if (isImporting) return;
          handleImportClick();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: isExporting ? "Exporting…" : "Export JSON",
        disabled: isExporting,
        action: () => {
          if (isExporting) return;
          void handleExportGraph();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Reset sample",
        disabled: false,
        action: () => {
          handleResetSmallSample();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Reset big sample",
        disabled: false,
        action: () => {
          handleResetLargeSample();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Auto layout",
        disabled: false,
        action: () => {
          handleAutoLayoutAll();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Fit view",
        disabled: false,
        action: () => {
          reactFlowInstanceRef.current?.fitView({ padding: canvasFitViewPadding });
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Undo",
        disabled: false,
        action: () => {
          reactFlowToolbarActions.undo();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Redo",
        disabled: false,
        action: () => {
          reactFlowToolbarActions.redo();
          setIsGraphActionsOpen(false);
        },
      },
      {
        label: "Toggle theme",
        disabled: false,
        action: () => {
          handleThemeToggle();
          setIsGraphActionsOpen(false);
        },
      },
    ],
    [
      canvasFitViewPadding,
      handleAddContainer,
      handleAutoLayoutAll,
      handleExportGraph,
      handleImportClick,
      handleResetLargeSample,
      handleResetSmallSample,
      handleThemeToggle,
      isExporting,
      isImporting,
      reactFlowToolbarActions,
    ]
  );

  const handleNodeDoubleClick = useCallback(
    (_event: unknown, node: Node<EditorNodeData>) => {
      if (node.type === "course") {
        openInspectorForCourse(node.id);
      } else if (node.type === "container") {
        openInspectorForContainer(node.id);
      } else {
        return;
      }
      setIsMenuOpen(false);
      if (isLargeViewport) {
        setIsDetailBubbleOpen(true);
      } else {
        setIsInspectorOpen(true);
      }
    },
    [isLargeViewport, openInspectorForContainer, openInspectorForCourse]
  );

  const pageContainerClasses =
    theme === "dark"
      ? "flex h-full min-h-[calc(100vh-4rem)] flex-col gap-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-0 py-6 text-slate-100 transition-colors sm:gap-6"
      : "flex h-full min-h-[calc(100vh-4rem)] flex-col gap-4 bg-gradient-to-b from-slate-50 via-white to-slate-200 px-0 py-6 text-slate-900 transition-colors sm:gap-6";

  return (
    <div className={pageContainerClasses}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-sm font-medium text-brand hover:underline"
      >
        ← Back to dashboard
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <AddCourseDialog
        open={isAddCourseOpen}
        onClose={() => setIsAddCourseOpen(false)}
        onSubmit={handleCreateCourse}
        isSubmitting={createCourseMutation.isPending}
      />

      <div className={workspaceClasses}>
        <div className="flex h-full flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch lg:gap-8">
          <div className="relative flex-1 min-h-[520px]">
            {detailQuery.isLoading && <Skeleton className="absolute inset-0" />}
            <ReactFlowProvider>
              <GraphEditorCanvas
                theme={theme}
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onSelectionChange={handleSelectionChange}
                onNodeDragStop={handleNodeDragStop}
                onNodeDoubleClick={handleNodeDoubleClick}
                onConnect={handleConnect}
                onEdgesDelete={handleEdgesDelete}
                onReady={(instance) => {
                  reactFlowInstanceRef.current = instance;
                  instance.fitView({ padding: canvasFitViewPadding });
                }}
                minZoom={canvasMinZoom}
              />
            </ReactFlowProvider>

            <div className="pointer-events-none absolute inset-0">
              <div className="pointer-events-auto absolute left-6 top-6 z-20 flex flex-wrap items-start gap-3">
                <div className={infoBubbleClasses}>{infoBubbleContent}</div>
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    disabled={!hasSelection}
                    onClick={() => hasSelection && setIsMenuOpen((prev) => !prev)}
                    className={`${menuButtonClasses} ${hasSelection ? "" : "cursor-not-allowed opacity-40"}`}
                  >
                    <span className="text-base">{isMenuOpen ? "→" : "↠"}</span>
                  </button>
                  {isMenuOpen && menuItems.length > 0 ? (
                    <div className={menuPanelClasses}>
                      <ul className="flex flex-col gap-1">
                        {menuItems.map((item) => (
                          <li key={item.label}>
                            <button
                              type="button"
                              onClick={item.action}
                              className={`${menuItemClasses} ${item.danger ? menuItemDangerClasses : ""}`}
                            >
                              {item.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pointer-events-auto absolute right-6 top-6 z-20 flex flex-col items-end gap-3">
                <button
                  type="button"
                  aria-expanded={isGraphActionsOpen}
                  onClick={() => setIsGraphActionsOpen((prev) => !prev)}
                  className={graphActionsButtonClasses}
                >
                  Graph actions
                </button>
                {isGraphActionsOpen ? (
                  <div className={`${graphActionPanelClasses} self-end`}>
                    {graphActionItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                        disabled={item.disabled}
                        className={`${graphActionItemClasses} ${
                          item.disabled ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (canOpenInspector) {
                  setIsDetailBubbleOpen(true);
                  if (!isLargeViewport) {
                    setIsInspectorOpen(true);
                  }
                }
              }}
              disabled={!canOpenInspector}
              className="pointer-events-auto absolute bottom-6 right-6 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
            >
              {canOpenInspector ? "Open details" : "Select an item"}
            </button>

            {isLargeViewport && isDetailBubbleOpen ? (
              <div className="pointer-events-auto absolute right-6 top-32 z-20 w-[24rem] max-w-full">
                <div className={inspectorBubbleClasses}>
                  <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    <span>Details</span>
                    <button
                      type="button"
                      onClick={() => setIsDetailBubbleOpen(false)}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Close
                    </button>
                  </div>
                  <div
                    className="max-h-[70vh] overflow-y-auto pr-1"
                    data-testid="inspector-expanded"
                  >
                    {inspectorContent}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isInspectorOpen && !isLargeViewport ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            aria-label="Close inspector"
            onClick={closeInspector}
            className="absolute inset-0 bg-slate-900/60 focus:outline-none"
          />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col p-4 sm:p-6">
            <div className={inspectorShellClasses}>{inspectorContent}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type GraphEditorCanvasProps = {
  nodes: Node<EditorNodeData>[];
  edges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  onSelectionChange: (params: OnSelectionChangeParams) => void;
  onNodeDragStop: (event: unknown, node: Node<EditorNodeData>) => void;
  onNodeDoubleClick: (event: unknown, node: Node<EditorNodeData>) => void;
  onConnect: (connection: Connection) => void;
  onEdgesDelete: (edges: Edge[]) => void;
  onReady: (instance: ReactFlowInstance) => void;
  minZoom: number;
  theme: ThemeMode;
};

function GraphEditorCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onSelectionChange,
  onNodeDragStop,
  onNodeDoubleClick,
  onConnect,
  onEdgesDelete,
  onReady,
  minZoom,
  theme,
}: GraphEditorCanvasProps) {
  const flowBackground = theme === "dark" ? "bg-slate-950/85" : "bg-slate-100";
  const gridOverlay =
    theme === "dark"
      ? "[background-image:radial-gradient(circle_at_top_left,_rgba(148,163,184,0.05),_transparent_70%),radial-gradient(circle_at_bottom_right,_rgba(100,116,139,0.05),_transparent_70%)]"
      : "bg-white";

  return (
    <div className={`relative h-full w-full overflow-hidden ${flowBackground}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
        minZoom={minZoom}
        className={`h-full w-full ${gridOverlay}`}
        defaultEdgeOptions={{ type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } }}
        proOptions={{ hideAttribution: true }}
        onInit={onReady}
      >
        <MiniMap pannable zoomable />
        <Controls />
        <Background
          gap={28}
          size={1.8}
          color={theme === "dark" ? "rgba(31,41,55,0.6)" : "rgba(148,163,184,0.35)"}
        />
      </ReactFlow>
    </div>
  );
}

export type AddCourseFormState = {
  code: string;
  title: string;
  credits: string;
  term: string;
  status: CourseStatus;
  notes: string;
  is_pass_fail: boolean;
};

const ADD_COURSE_DEFAULT_STATE: AddCourseFormState = {
  code: "",
  title: "",
  credits: "3",
  term: "",
  status: "planned",
  notes: "",
  is_pass_fail: false,
};

type AddCourseDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddCourseFormState) => void;
  isSubmitting: boolean;
};

export function AddCourseDialog({ open, onClose, onSubmit, isSubmitting }: AddCourseDialogProps) {
  const [formState, setFormState] = useState<AddCourseFormState>(ADD_COURSE_DEFAULT_STATE);

  useEffect(() => {
    if (open) {
      setFormState(ADD_COURSE_DEFAULT_STATE);
    }
  }, [open]);

  const handleChange =
    (field: keyof AddCourseFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formState);
  };

  if (!open) {
    return null;
  }

  const fieldLabelClass = "flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300";
  const fieldInputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-100 dark:placeholder:text-slate-500";
  const checkboxClass =
    "h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand dark:border-slate-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add course</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Provide the basic details for the new course node. You can fine-tune attributes after
              it appears on the canvas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Close
          </button>
        </header>

        <div className="space-y-3">
          <label className={fieldLabelClass}>
            Code
            <input
              required
              value={formState.code}
              onChange={handleChange("code")}
              className={fieldInputClass}
            />
          </label>

          <label className={fieldLabelClass}>
            Title
            <input
              required
              value={formState.title}
              onChange={handleChange("title")}
              className={fieldInputClass}
            />
          </label>

          <label className={fieldLabelClass}>
            Credits
            <input
              required
              type="number"
              min={0}
              step={1}
              value={formState.credits}
              onChange={handleChange("credits")}
              className={fieldInputClass}
            />
          </label>

          <label className={fieldLabelClass}>
            Term (optional)
            <input
              value={formState.term}
              onChange={handleChange("term")}
              placeholder="e.g. Fall 2025"
              className={fieldInputClass}
            />
          </label>

          <label className={fieldLabelClass}>
            Status
            <select
              value={formState.status}
              onChange={handleChange("status")}
              className={fieldInputClass}
            >
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formState.is_pass_fail}
              onChange={handleChange("is_pass_fail")}
              className={checkboxClass}
            />
            Pass/fail course
          </label>

          <label className={fieldLabelClass}>
            Notes (optional)
            <textarea
              rows={3}
              value={formState.notes}
              onChange={handleChange("notes")}
              className={fieldInputClass}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add course"}
          </button>
        </div>
      </form>
    </div>
  );
}

type CourseSidePanelProps = {
  course: CourseDetail;
  assignedContainerId?: string;
  containerOptions: { id: string; title: string }[];
  onChange: (courseId: string, containerId: string | "") => void;
  onClose: () => void;
};

function CourseSidePanel({
  course,
  assignedContainerId,
  containerOptions,
  onChange,
  onClose,
}: CourseSidePanelProps) {
  const { graphId } = useParams<{ graphId: string }>();
  const updateCourseMutation = useUpdateCourseMutation(graphId ?? "");
  const [formState, setFormState] = useState(() => ({
    title: course.title,
    code: course.code,
    term: course.term ?? "",
    status: course.status,
    notes: course.notes ?? "",
    container: assignedContainerId ?? "",
    credits: course.credits.toString(),
    grade: course.grade ?? "",
    is_pass_fail: course.is_pass_fail,
  }));

  useEffect(() => {
    setFormState({
      title: course.title,
      code: course.code,
      term: course.term ?? "",
      status: course.status,
      notes: course.notes ?? "",
      container: assignedContainerId ?? "",
      credits: course.credits.toString(),
      grade: course.grade ?? "",
      is_pass_fail: course.is_pass_fail,
    });
  }, [assignedContainerId, course]);

  const handleChange =
    (field: keyof typeof formState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const creditsValue = Number(formState.credits);
      const updatePayload: Record<string, unknown> = {
        title: formState.title,
        code: formState.code,
        term: formState.term || null,
        status: formState.status,
        notes: formState.notes || null,
        is_pass_fail: formState.is_pass_fail,
        grade: formState.grade ? formState.grade : null,
      };
      if (Number.isFinite(creditsValue) && creditsValue >= 0) {
        updatePayload.credits = Math.round(creditsValue);
      }
      await updateCourseMutation.mutateAsync({
        courseId: course.id,
        data: updatePayload,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update course", error);
    }
  };

  const fieldLabelClass = "flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300";
  const fieldInputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-100 dark:placeholder:text-slate-500";
  const checkboxClass =
    "h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand dark:border-slate-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.8)]"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {course.code}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Course details</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Close
        </button>
      </header>

      <label className={fieldLabelClass}>
        Title
        <input
          value={formState.title}
          onChange={handleChange("title")}
          className={fieldInputClass}
        />
      </label>

      <label className={fieldLabelClass}>
        Code
        <input value={formState.code} onChange={handleChange("code")} className={fieldInputClass} />
      </label>

      <label className={fieldLabelClass}>
        Term
        <input
          value={formState.term}
          onChange={handleChange("term")}
          placeholder="e.g. Fall 2025"
          className={fieldInputClass}
        />
      </label>

      <label className={fieldLabelClass}>
        Status
        <select
          value={formState.status}
          onChange={handleChange("status")}
          className={fieldInputClass}
        >
          <option value="planned">Planned</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </label>

      <label className={fieldLabelClass}>
        Credits
        <input
          type="number"
          min={0}
          step={1}
          value={formState.credits}
          onChange={handleChange("credits")}
          className={fieldInputClass}
        />
      </label>

      <label className={fieldLabelClass}>
        Grade
        <input
          type="number"
          step={0.01}
          value={formState.grade}
          onChange={handleChange("grade")}
          disabled={formState.is_pass_fail}
          aria-label="Grade"
          className={`${fieldInputClass} disabled:bg-slate-100 dark:disabled:bg-slate-800/60`}
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Grades &gt;= {GRADE_PASS_THRESHOLD} mark the course as completed. Lower grades mark it as
          failed.
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={formState.is_pass_fail}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              is_pass_fail: event.target.checked,
              grade: event.target.checked ? "" : prev.grade,
            }))
          }
          className={checkboxClass}
        />
        Pass/fail course
      </label>

      <label className={fieldLabelClass}>
        Notes
        <textarea
          value={formState.notes}
          onChange={handleChange("notes")}
          rows={4}
          className={fieldInputClass}
        />
      </label>

      <label className={fieldLabelClass}>
        Container
        <select
          value={formState.container}
          onChange={(event) => {
            const value = event.target.value;
            setFormState((prev) => ({ ...prev, container: value }));
            onChange(course.id, value);
          }}
          className={fieldInputClass}
        >
          <option value="">No container</option>
          {containerOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </label>

      <EligibilityList course={course} />

      <button
        type="submit"
        disabled={updateCourseMutation.isPending}
        className="mt-auto rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {updateCourseMutation.isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

type ContainerSidePanelProps = {
  container: ContainerShape;
  members: CourseDetail[];
  onChange: (containerId: string, updates: Partial<ContainerShape>) => void;
  onClose: () => void;
  theme: ThemeMode;
};

function ContainerSidePanel({
  container,
  members,
  onChange,
  onClose,
  theme,
}: ContainerSidePanelProps) {
  const [title, setTitle] = useState(container.title);
  const [paletteId, setPaletteId] = useState<string | null>(container.palette_id ?? null);

  useEffect(() => {
    setTitle(container.title);
    setPaletteId(container.palette_id ?? null);
  }, [container]);

  const handlePaletteSelect = (nextPaletteId: string | null) => {
    setPaletteId(nextPaletteId);
    onChange(container.id, {
      palette_id: nextPaletteId ?? null,
      color: storedContainerColor(nextPaletteId, container.color),
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange(container.id, { title });
    onClose();
  };

  const previewVisual = resolveContainerVisuals(
    {
      ...container,
      title,
      palette_id: paletteId,
      color: storedContainerColor(paletteId, container.color),
    },
    theme
  );

  const fieldLabelClass = "flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300";
  const fieldInputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-100 dark:placeholder:text-slate-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.8)]"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {container.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Container settings</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Close
        </button>
      </header>

      <label className={fieldLabelClass}>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldInputClass}
        />
      </label>

      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <span>Colour</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePaletteSelect(null)}
            className={`h-10 w-10 rounded-full border transition ${
              paletteId === null
                ? "border-brand ring-2 ring-brand/50"
                : "border-slate-300 dark:border-slate-600"
            }`}
            style={{
              background: DEFAULT_CONTAINER_FALLBACK[theme].fill,
            }}
            title="Neutral"
          />
          {CONTAINER_PALETTE.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handlePaletteSelect(entry.id)}
              className={`h-10 w-10 rounded-full border transition ${
                paletteId === entry.id
                  ? "border-brand ring-2 ring-brand/50"
                  : "border-slate-300 dark:border-slate-600"
              }`}
              style={{
                background: theme === "dark" ? entry.dark.fill : entry.light.fill,
                boxShadow:
                  theme === "dark"
                    ? "inset 0 0 0 1px rgba(148,163,184,0.15), 0 18px 40px -32px rgba(15,23,42,0.9)"
                    : "inset 0 0 0 1px rgba(15,23,42,0.06), 0 18px 40px -32px rgba(15,23,42,0.28)",
              }}
              title={entry.label}
            />
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl border p-4 shadow-sm transition"
        style={{
          background: previewVisual.fill,
          borderColor: previewVisual.border,
          boxShadow:
            theme === "dark"
              ? DEFAULT_CONTAINER_FALLBACK.dark.shadow
              : DEFAULT_CONTAINER_FALLBACK.light.shadow,
        }}
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-300">
          <span>Preview</span>
          <span className="rounded-full border border-white/40 px-2 py-0.5 text-[11px] uppercase tracking-wide text-white/80">
            {title || "Untitled"}
          </span>
        </div>
        <div className="mt-3 h-20 rounded-xl border border-dashed border-white/30 bg-white/5 dark:border-slate-500/40 dark:bg-white/5" />
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <header className="mb-2 font-medium text-slate-700 dark:text-slate-200">Members</header>
        {members.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag a course into this container to assign it.
          </p>
        ) : (
          <ul className="space-y-1 text-xs">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {member.code}
                </span>
                <span className="truncate text-slate-500 dark:text-slate-400">{member.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="submit"
        className="mt-auto rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark"
      >
        Save changes
      </button>
    </form>
  );
}

type EligibilityListProps = {
  course: CourseDetail;
};

function EligibilityList({ course }: EligibilityListProps) {
  if (!course.prerequisites.length) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        No prerequisites.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
      <p className="font-medium text-slate-700 dark:text-slate-200">Prerequisites</p>
      <ul className="mt-2 space-y-1">
        {course.prerequisites.map((item) => (
          <li key={item.course_id}>
            <span>{item.course_id}</span>
            {item.condition ? (
              <span className="text-slate-500 dark:text-slate-400"> — {item.condition}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
