import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  BackgroundVariant,
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
  type MiniMapNodeProps,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import "../styles/graph-editor-v2.css";

import { api } from "../lib/api";
import { useHealthQuery } from "../features/health/useHealthQuery";
import {
  type CourseDetail,
  type CoursePrerequisite,
  type CourseStatus,
  type GraphDetail,
  useGraphDetailQuery,
} from "../sections/graph-editor/useGraphDetailQuery";
import {
  GraphSelectionProvider,
  useGraphSelection,
} from "../sections/graph-editor/useGraphSelection";
import { useCreateCourseMutation } from "../sections/graph-editor/useCreateCourseMutation";
import { useUpdateCourseMutation } from "../sections/graph-editor/useUpdateCourseMutation";
import { useUpdatePrerequisitesMutation } from "../sections/graph-editor/useUpdatePrerequisitesMutation";
import { useDeleteCourseMutation } from "../sections/graph-editor/useDeleteCourseMutation";
import { useUpdateGraphMutation } from "../sections/graph-editor/useUpdateGraphMutation";
import {
  cloneGraphDetail,
  createAssignmentsPersistence,
} from "../sections/graph-editor/graphPersistence";
import {
  buildAssignments,
  buildMultiSelectionSummary,
  normaliseContainers,
  normaliseCourses,
  prepareSampleGraphImport,
  type ImportCoursePayload,
  type NormalisedContainer,
  type SampleGraph,
} from "../sections/graph-editor/sampleGraphImport";
import { useLoadingState, LoadingOperations } from "../hooks/useLoadingState";
import { InlineSpinner } from "../components/Spinner";
import { GraphEditorSkeleton } from "../components/SkeletonLoader";
import { useQueryClient } from "@tanstack/react-query";
import type { ContainerShape } from "../sections/graph-editor/types";
import {
  CONTAINER_PALETTE,
  GRADE_PASS_THRESHOLD,
  THEME_TOKENS,
  type ContainerPaletteColor,
  type StatusKey,
} from "../styles/tokens";
import {
  COURSE_SLOT_HEIGHT,
  COURSE_SLOT_WIDTH,
  GRID_CONFIG,
  snapPoint,
  snapSize,
} from "../sections/graph-editor/layout";
import smallSampleRaw from "../fixtures/smallSampleGraph.json";
import largeSampleRaw from "../fixtures/largeSampleGraph.json";

type EditorNodeData = CourseNodeData | ContainerNodeData;

type CourseNodeData = {
  kind: "course";
  course: CourseDetail;
  hasUnmetPrereqs: boolean;
  onSelect: (courseId: string) => void;
};

type ContainerNodeData = {
  kind: "container";
  container: ContainerShape;
  onSelect: (containerId: string) => void;
  courseCount: number;
  // Removed: grid property - no longer using grid layout
};

type ThemeMode = "light" | "dark";

function resolveCourseStatusKey(course: CourseDetail, hasUnmetPrereqs: boolean): StatusKey {
  if (hasUnmetPrereqs) return "blocked";
  if (course.status === "completed") return "completed";
  if (course.status === "failed") return "failed";
  return "planned";
}

type HistoryEntry = {
  nodes: Node<EditorNodeData>[];
  edges: Edge[];
  assignments: Record<string, string>;
};

// Removed: ContainerLayoutState and layOutCoursesInContainer - grid layout system removed
// Courses now position freely, even within containers

// Removed: gatherAssignedCourseIds - no longer needed without reflow system

function parkCourseOutsideContainer(
  containerNode: Node<ContainerNodeData>,
  coursePosition: { x: number; y: number }
): { x: number; y: number } {
  const containerPosition = snapPoint(containerNode.position);
  const width = (containerNode.style?.width as number) ?? containerNode.data.container.width;
  const height = (containerNode.style?.height as number) ?? containerNode.data.container.height;

  const left = containerPosition.x;
  const right = containerPosition.x + width;
  const top = containerPosition.y;
  const bottom = containerPosition.y + height;

  const courseCenterX = coursePosition.x + COURSE_SLOT_WIDTH / 2;
  const courseCenterY = coursePosition.y + COURSE_SLOT_HEIGHT / 2;

  const distances = {
    left: Math.abs(courseCenterX - left),
    right: Math.abs(right - courseCenterX),
    top: Math.abs(courseCenterY - top),
    bottom: Math.abs(bottom - courseCenterY),
  } as const;

  const entries = Object.entries(distances) as Array<["left" | "right" | "top" | "bottom", number]>;
  const [edge] = entries.sort((a, b) => a[1] - b[1])[0] ?? ["right", 0];
  const offset = GRID_CONFIG.UNIT;

  switch (edge) {
    case "left":
      return snapPoint({
        x: left - COURSE_SLOT_WIDTH - offset,
        y: coursePosition.y,
      });
    case "right":
      return snapPoint({
        x: right + offset,
        y: coursePosition.y,
      });
    case "top":
      return snapPoint({
        x: coursePosition.x,
        y: top - COURSE_SLOT_HEIGHT - offset,
      });
    case "bottom":
    default:
      return snapPoint({
        x: coursePosition.x,
        y: bottom + offset,
      });
  }
}

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

// Removed: ACCENT_COLORS - unused

function withAlpha(color: string, alpha: number): string {
  const trimmed = color.trim().toLowerCase();
  if (trimmed.startsWith("rgba(")) {
    const [r, g, b] = trimmed
      .slice(5, -1)
      .split(",")
      .slice(0, 3)
      .map((value) => Number.parseFloat(value));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (trimmed.startsWith("rgb(")) {
    const [r, g, b] = trimmed
      .slice(4, -1)
      .split(",")
      .map((value) => Number.parseFloat(value));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (trimmed.startsWith("#")) {
    const hex =
      trimmed.length === 4 ? trimmed.replace(/./g, (c) => (c === "#" ? "#" : `${c}${c}`)) : trimmed;
    const bigint = Number.parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

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
  const { course, hasUnmetPrereqs, onSelect } = data;

  const displayStatus =
    course.status.charAt(0).toUpperCase() + course.status.slice(1).replace("_", " ");
  const statusClassName = `status status--${course.status.replace("_", "-")}`;
  const nodeClassName = `course-node status-${course.status}${hasUnmetPrereqs ? " course-node--blocked" : ""}`;
  const gradeBadge = course.grade ? Number(course.grade).toFixed(0) : null;

  // Determine grade tier for styling
  let gradeTier = "";
  let gradeNum = 0;
  if (gradeBadge) {
    gradeNum = Number(gradeBadge);
    if (gradeNum >= 90) {
      gradeTier = "grade-gold";
    } else if (gradeNum >= 70) {
      gradeTier = "grade-silver";
    } else if (gradeNum >= 55) {
      // Assuming 55 is pass threshold
      gradeTier = "grade-bronze";
    } else {
      gradeTier = "grade-fail";
    }
  }

  // Build meta pills: credits, MATH (dept), Level 200, Spring (term)
  const metaPills = [];
  metaPills.push(`${course.credits} credit${course.credits === 1 ? "" : "s"}`);
  // You can extract department from course code or add a dept field
  // For now, we'll skip dept if not available
  // metaPills.push("MATH");
  if (course.code) {
    // Extract level from code if it contains numbers (e.g., CS204 -> Level 200)
    const levelMatch = course.code.match(/\d+/);
    if (levelMatch) {
      const level = levelMatch[0];
      metaPills.push(`Level ${level}`);
    }
  }
  if (course.term) {
    metaPills.push(course.term);
  }

  return (
    <div className={nodeClassName} onDoubleClick={() => onSelect(course.id)}>
      <Handle type="target" position={Position.Left} id="in" />
      <div className="course-node__header">
        <span className="course-node__codepill" title={course.code}>
          {course.code}
        </span>
        <span className="course-node__dot" />
        {gradeBadge && (
          <span className="course-node__grade-wrapper">
            <span className={`course-node__grade ${gradeTier}`} data-grade={gradeBadge}>
              {gradeBadge}
            </span>
            {gradeTier === "grade-gold" && gradeNum >= 91 && (
              <>
                <span className="sparkle sparkle-1">✨</span>
                <span className="sparkle sparkle-2">✨</span>
                {gradeNum >= 92 && <span className="sparkle sparkle-3">✨</span>}
                {gradeNum >= 93 && <span className="sparkle sparkle-4">✨</span>}
                {gradeNum >= 94 && <span className="sparkle sparkle-5">✨</span>}
                {gradeNum >= 95 && <span className="sparkle sparkle-6">✨</span>}
              </>
            )}
          </span>
        )}
        <span className={statusClassName}>{displayStatus}</span>
      </div>
      <div className="course-node__body">
        <h3 className="course-node__title" title={course.title}>
          {course.title.length === 0 ? "Untitled" : course.title}
        </h3>
      </div>
      <div className="course-node__meta">
        {metaPills.map((pill, index) => (
          <span key={`${pill}-${index}`} className="pill">
            {pill}
          </span>
        ))}
        {hasUnmetPrereqs && <div className="subtext">Prerequisites not met</div>}
      </div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

type ContainerNodeProps = NodeProps<ContainerNodeData>;

function ContainerNode({ data, selected }: ContainerNodeProps) {
  const { container, onSelect, courseCount } = data;

  // Use palette_id to determine the tone/color variant
  const tone = container.palette_id || "indigo"; // Default to indigo if no palette selected
  const toneClassName = `container-node tone-${tone}${selected ? " is-selected" : ""}`;

  return (
    <div className={toneClassName} onDoubleClick={() => onSelect(container.id)}>
      <Handle type="target" position={Position.Left} id="in" style={{ opacity: 0.6, top: 20 }} />
      <div className="container-node__header">
        <span className="container-node__title" title={container.title}>
          {container.title}
        </span>
        <span className="container-node__count" aria-label={`${courseCount} courses`}>
          {courseCount === 1 ? "1 COURSE" : `${courseCount} COURSES`}
        </span>
      </div>
      <div className="container-node__body">
        {/* Course nodes are rendered as children by React Flow */}
      </div>
      <Handle type="source" position={Position.Right} id="out" style={{ opacity: 0.6, top: 20 }} />
    </div>
  );
}

const nodeTypes = {
  course: CourseNode,
  container: ContainerNode,
};

const EMPTY_ASSIGNMENTS: Record<string, string> = {};

const THEME_STORAGE_KEY = "course-atlas-theme";

function randomId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random()}`;
}

function generateUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
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

function GraphEditorPageInner() {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const selection = useGraphSelection();
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLargeViewport, setIsLargeViewport] = useState(initialViewportIsLarge);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGraphActionsOpen, setIsGraphActionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [gridStyle, setGridStyle] = useState<"dots" | "lines">("dots");
  const [gridDotSize, setGridDotSize] = useState(1);
  const [gridLineWidth, setGridLineWidth] = useState(1);
  const [nodeBlur, setNodeBlur] = useState(8);
  const {
    courses: selectedCourseIds,
    containers: selectedContainerIds,
    edges: selectedEdgeIds,
    // detailTarget, // Unused after removing collision system
    isDetailOpen,
    totals: selectionTotals,
    lastClicked: lastClickedTarget,
    rememberClick,
    toggleDetail: toggleSelectionDetail,
    openDetail: openSelectionDetail,
    openAggregateDetail,
    closeDetail: closeSelectionDetail,
    select: applySelection,
    clear: clearSelection,
  } = selection;

  const [courseAssignments, setCourseAssignments] = useState<Record<string, string>>({});

  const historyRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);

  const nodesRef = useRef<Node<EditorNodeData>[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const assignmentsRef = useRef<Record<string, string>>(courseAssignments);
  const containerPersistTimeoutRef = useRef<number | null>(null);
  const coursePositionUpdateTimeoutRef = useRef<number | null>(null);
  const pendingCourseUpdatesRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodesMapRef = useRef<Map<string, Node<EditorNodeData>>>(new Map());
  const graphMutationQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  // Loading state management (#11)
  const loading = useLoadingState();

  const updateGraphCache = useCallback(
    (updater: (draft: GraphDetail) => void) => {
      if (!graphId) return () => {};
      const key = ["graph", graphId] as const;
      const previous = queryClient.getQueryData<GraphDetail>(key);
      if (!previous) return () => {};
      const draft = cloneGraphDetail(previous);
      updater(draft);
      queryClient.setQueryData(key, draft);
      return () => queryClient.setQueryData(key, previous);
    },
    [graphId, queryClient]
  );

  const enqueueGraphMutation = useCallback((task: () => Promise<void>) => {
    graphMutationQueueRef.current = graphMutationQueueRef.current.catch(() => undefined).then(task);
    return graphMutationQueueRef.current.then(
      () => undefined,
      (error) => {
        console.error("Graph mutation failed", error);
        throw error;
      }
    );
  }, []);

  // Helper function to update nodes and sync nodesMapRef (#3)
  const updateNodesWithMap = useCallback(
    (updater: (prev: Node<EditorNodeData>[]) => Node<EditorNodeData>[]) => {
      setNodes((prev) => {
        const next = updater(prev);

        // Always sync map with O(1) lookups
        const nextMap = new Map<string, Node<EditorNodeData>>();
        next.forEach((node) => nextMap.set(node.id, node));
        nodesMapRef.current = nextMap;

        return next;
      });
    },
    [setNodes]
  );

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    assignmentsRef.current = courseAssignments;
  }, [courseAssignments]);

  // courseOrderIndex - no longer needed without reflow system
  /*
  const courseOrderIndex = useMemo(() => {
    const map = new Map<string, number>();
    (detailQuery.data?.courses ?? []).forEach((course, index) => {
      map.set(course.id, index);
    });
    return map;
  }, [detailQuery.data?.courses]);
  */

  const courseDetailMap = useMemo(() => {
    const map = new Map<string, CourseDetail>();
    (detailQuery.data?.courses ?? []).forEach((course) => {
      map.set(course.id, course);
    });
    return map;
  }, [detailQuery.data?.courses]);

  const reflowAfterAssignment = useCallback(
    (
      nodes: Node<EditorNodeData>[],
      courseId: string,
      previousParent: string | null,
      nextParent: string | null
      // assignments: Record<string, string> // Unused after removing reflow
    ) => {
      const updated = [...nodes];
      const courseIndex = updated.findIndex((node) => node.id === courseId);
      if (courseIndex === -1) return updated;

      const originalCourseNode = updated[courseIndex] as Node<CourseNodeData>;
      const courseDetail = courseDetailMap.get(courseId) ?? originalCourseNode.data.course;

      const findContainerNode = (id: string | null) =>
        id
          ? (updated.find((node) => node.id === id) as Node<ContainerNodeData> | undefined)
          : undefined;

      const previousContainerNode = findContainerNode(previousParent);
      const nextContainerNode = findContainerNode(nextParent);

      // Calculate current absolute position (without snapping to avoid jumps)
      const absoluteBefore =
        previousParent && previousContainerNode
          ? {
              x: previousContainerNode.position.x + originalCourseNode.position.x,
              y: previousContainerNode.position.y + originalCourseNode.position.y,
            }
          : {
              x: originalCourseNode.position.x,
              y: originalCourseNode.position.y,
            };

      let courseNode: Node<CourseNodeData> = { ...originalCourseNode };

      if (!nextParent) {
        // Moving OUT of container - snap to grid and use absolute position
        const parkedPosition = previousContainerNode
          ? parkCourseOutsideContainer(previousContainerNode, absoluteBefore)
          : snapPoint(absoluteBefore);
        courseNode = {
          ...courseNode,
          parentNode: undefined,
          extent: undefined,
          position: parkedPosition,
          positionAbsolute: undefined,
          data: {
            ...courseNode.data,
            course: {
              ...courseDetail,
              position_x: parkedPosition.x,
              position_y: parkedPosition.y,
            },
          },
        } satisfies Node<CourseNodeData>;
      } else {
        // Moving INTO or BETWEEN containers - calculate relative position
        const relativePosition = nextContainerNode
          ? {
              x: absoluteBefore.x - nextContainerNode.position.x,
              y: absoluteBefore.y - nextContainerNode.position.y,
            }
          : absoluteBefore;

        courseNode = {
          ...courseNode,
          parentNode: nextParent,
          position: relativePosition,
          positionAbsolute: absoluteBefore,
          // Note: Position in data.course is NOT updated here - it will be updated on next drag
          // This prevents inconsistency between node position and data position
          // Removed: extent: "parent" - allows free positioning even within containers
        } satisfies Node<CourseNodeData>;
      }

      updated[courseIndex] = courseNode;

      return updated;
    },
    [courseDetailMap]
  );

  const openInspectorForCourse = useCallback(
    (courseId: string) => {
      openSelectionDetail("course", courseId);
    },
    [openSelectionDetail]
  );

  const openInspectorForContainer = useCallback(
    (containerId: string) => {
      openSelectionDetail("container", containerId);
    },
    [openSelectionDetail]
  );

  const closeInspector = useCallback(() => {
    setIsMenuOpen(false);
    clearSelection();
  }, [clearSelection]);

  useEffect(() => {
    // Capture refs for cleanup (#18)
    const courseTimeoutRef = coursePositionUpdateTimeoutRef;
    const containerTimeoutRef = containerPersistTimeoutRef;
    const pendingUpdates = pendingCourseUpdatesRef;
    const mutation = updateCourseMutation;

    return () => {
      // Cleanup: flush pending updates on unmount
      if (courseTimeoutRef.current !== null) {
        window.clearTimeout(courseTimeoutRef.current);
        courseTimeoutRef.current = null;
      }
      if (containerTimeoutRef.current !== null) {
        window.clearTimeout(containerTimeoutRef.current);
        containerTimeoutRef.current = null;
      }

      // Flush pending course position updates immediately to prevent data loss
      if (pendingUpdates.current.size > 0) {
        const updates = Array.from(pendingUpdates.current.entries());
        pendingUpdates.current.clear();

        // Fire and forget - don't wait for completion
        Promise.all(
          updates.map(([courseId, position]) =>
            mutation
              .mutateAsync({
                courseId,
                data: { position },
              })
              .catch((error) => {
                console.error(`Failed to flush course ${courseId} position on unmount`, error);
              })
          )
        );
      }
    };
  }, [updateCourseMutation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const applyViewport = (matches: boolean) => {
      setIsLargeViewport(matches);
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
    if (
      selectedCourseIds.length === 0 &&
      selectedContainerIds.length === 0 &&
      selectedEdgeIds.length === 0
    ) {
      setIsMenuOpen(false);
    }
  }, [selectedCourseIds.length, selectedContainerIds.length, selectedEdgeIds.length]);

  const pushHistory = useCallback(() => {
    const snapshot: HistoryEntry = {
      nodes: cloneNodes(nodesRef.current),
      edges: cloneEdges(edgesRef.current),
      assignments: { ...assignmentsRef.current },
    };
    historyRef.current = [...historyRef.current.slice(-19), snapshot];
    futureRef.current = [];
  }, []);

  const lastDetailTimestampRef = useRef<number>(-1);

  const serializeContainersFromNodes = useCallback((): ContainerShape[] => {
    return nodesRef.current
      .filter((node) => node.type === "container")
      .map((node) => {
        const data = node.data as ContainerNodeData;
        const snappedPosition = snapPoint(node.position);
        const snappedSize = snapSize({
          width: typeof node.style?.width === "number" ? node.style.width : data.container.width,
          height:
            typeof node.style?.height === "number" ? node.style.height : data.container.height,
        });
        return {
          id: node.id,
          title: data.container.title,
          palette_id: data.container.palette_id ?? null,
          color: storedContainerColor(data.container.palette_id ?? null, data.container.color),
          width: snappedSize.width,
          height: snappedSize.height,
          position: snappedPosition,
        };
      });
  }, []);

  const updateGraphMutation = useUpdateGraphMutation(graphId ?? "");

  // Unified flush function for both containers and course positions (#6)
  // This eliminates race conditions by handling both updates atomically
  const flushGraphPersistence = useCallback(async () => {
    if (!graphId) return;
    const serializedContainers = serializeContainersFromNodes();
    const courseUpdates = Array.from(pendingCourseUpdatesRef.current.entries());
    pendingCourseUpdatesRef.current.clear();

    // Atomic cache update: both containers AND course positions together
    const rollback = updateGraphCache((draft) => {
      // Update containers
      draft.graph.containers = serializedContainers.map((container) => ({ ...container }));

      // Update course positions
      courseUpdates.forEach(([courseId, position]) => {
        const courseIndex = draft.courses.findIndex((c) => c.id === courseId);
        if (courseIndex !== -1) {
          draft.courses[courseIndex].position_x = position.x;
          draft.courses[courseIndex].position_y = position.y;
        }
      });
    });

    await enqueueGraphMutation(async () => {
      try {
        // Update containers
        await updateGraphMutation.mutateAsync({ containers: serializedContainers });

        // Update course positions
        courseUpdates.forEach(([courseId, position]) => {
          void updateCourseMutation
            .mutateAsync({
              courseId,
              data: { position },
            })
            .catch((error) => {
              console.error(`Failed to update course ${courseId} position`, error);
              toast.error("Failed to save course position. Changes may be lost.", {
                duration: 5000,
              });
              void detailQuery.refetch();
            });
        });
      } catch (error) {
        console.error("Failed to persist graph changes", error);
        toast.error("Failed to save changes. Please try again.", {
          duration: 5000,
        });
        rollback();
        throw error;
      }
    });
  }, [
    detailQuery,
    enqueueGraphMutation,
    graphId,
    serializeContainersFromNodes,
    updateCourseMutation,
    updateGraphCache,
    updateGraphMutation,
  ]);

  // Legacy wrapper for backward compatibility
  // Unified scheduler: replaces both scheduleCoursePositionUpdates and scheduleContainerPersistence (#6)
  const scheduleGraphPersistence = useCallback(() => {
    // Clear any existing timers
    if (coursePositionUpdateTimeoutRef.current !== null) {
      window.clearTimeout(coursePositionUpdateTimeoutRef.current);
      coursePositionUpdateTimeoutRef.current = null;
    }
    if (containerPersistTimeoutRef.current !== null) {
      window.clearTimeout(containerPersistTimeoutRef.current);
    }

    // Use unified 500ms debounce
    containerPersistTimeoutRef.current = window.setTimeout(() => {
      flushGraphPersistence().finally(() => {
        containerPersistTimeoutRef.current = null;
      });
    }, 500);
  }, [flushGraphPersistence]);

  // Legacy wrappers for backward compatibility - both now use unified scheduler
  const scheduleContainerPersistence = useCallback(() => {
    scheduleGraphPersistence();
  }, [scheduleGraphPersistence]);

  const scheduleCoursePositionUpdates = useCallback(() => {
    scheduleGraphPersistence();
  }, [scheduleGraphPersistence]);

  const persistAssignments = useMemo(
    () =>
      createAssignmentsPersistence({
        graphId,
        enqueueMutation: enqueueGraphMutation,
        updateGraphCache,
        updateGraphMutation,
      }),
    [enqueueGraphMutation, graphId, updateGraphCache, updateGraphMutation]
  );

  const persistAssignmentsSafe = useCallback(
    (assignments: Record<string, string>) => {
      const validCourseIds = new Set(
        nodesRef.current.filter((node) => node.type === "course").map((node) => node.id)
      );
      return persistAssignments(assignments, validCourseIds);
    },
    [persistAssignments]
  );

  const submitImportPayload = useCallback(
    async (payload: {
      replace_existing: boolean;
      containers: NormalisedContainer[];
      container_assignments: Record<string, string>;
      courses: ImportCoursePayload[];
    }) => {
      if (!graphId) return;
      await api.post(`api/v1/graphs/${graphId}/import`, {
        json: payload,
      });
      await detailQuery.refetch();
    },
    [detailQuery, graphId]
  );

  const applySampleGraph = useCallback(
    async (sample: SampleGraph) => {
      if (!graphId) return;
      try {
        setIsImporting(true);
        const { containers, courses, assignments } = prepareSampleGraphImport(sample, {
          generateId: generateUuid,
          resolveContainerColor: (paletteId, fallback) => storedContainerColor(paletteId, fallback),
        });

        const payload = {
          replace_existing: true,
          containers,
          container_assignments: assignments,
          courses,
        };
        await submitImportPayload(payload);
        toast.success("Sample graph loaded successfully");
      } catch (error) {
        if (error && typeof error === "object" && "response" in error) {
          const response = (error as { response: Response }).response;
          try {
            const detail = await response.json();
            console.error("Failed to apply sample graph", detail);
          } catch {
            console.error("Failed to apply sample graph", error);
          }
        } else {
          console.error("Failed to apply sample graph", error);
        }
        toast.error("Unable to load sample graph. Please try again.", {
          duration: 5000,
        });
      } finally {
        setIsImporting(false);
      }
    },
    [graphId, submitImportPayload]
  );

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail) {
      setNodes([]);
      setEdges([]);
      lastDetailTimestampRef.current = detailQuery.dataUpdatedAt ?? Date.now();
      return;
    }

    // Check if data has actually changed to avoid unnecessary rebuilds
    const dataTimestamp = detailQuery.dataUpdatedAt ?? Date.now();
    if (lastDetailTimestampRef.current === dataTimestamp && nodesRef.current.length > 0) {
      return;
    }
    lastDetailTimestampRef.current = dataTimestamp;

    // OPTIMIZATION NOTE: This rebuilds ALL nodes whenever data changes
    // Position updates are now handled separately and don't trigger cache updates,
    // but other mutations (title, status, etc.) will still cause full rebuilds
    // Future improvement: Use React Flow's updateNode() for incremental updates

    const remoteAssignments = detail.graph.container_assignments ?? EMPTY_ASSIGNMENTS;

    // Build a set of valid container IDs to sanitize assignments
    const validContainerIds = new Set(detail.graph.containers.map((c) => c.id));

    // Sanitize assignments: remove any assignments to non-existent containers
    const sanitizedAssignments: Record<string, string> = {};
    for (const [courseId, containerId] of Object.entries(remoteAssignments)) {
      if (validContainerIds.has(containerId)) {
        sanitizedAssignments[courseId] = containerId;
      } else {
        console.warn(
          `Course ${courseId} is assigned to non-existent container ${containerId}, removing assignment`
        );
      }
    }

    setCourseAssignments(sanitizedAssignments);
    assignmentsRef.current = sanitizedAssignments;

    // If we cleaned up any assignments, persist the sanitized version
    if (Object.keys(remoteAssignments).length !== Object.keys(sanitizedAssignments).length) {
      void persistAssignmentsSafe(sanitizedAssignments);
    }

    const courseOrderIndex = new Map(detail.courses.map((course, index) => [course.id, index]));

    // Simplified: No grid layout, containers just use their stored dimensions and positions
    const containerNodes: Node<ContainerNodeData>[] = detail.graph.containers.map((container) => {
      const position = snapPoint({
        x: Number.isFinite(container.position?.x) ? container.position.x : 0,
        y: Number.isFinite(container.position?.y) ? container.position.y : 0,
      });

      const assignedCourseIds = detail.courses
        .filter((course) => sanitizedAssignments[course.id] === container.id)
        .sort((a, b) => (courseOrderIndex.get(a.id) ?? 0) - (courseOrderIndex.get(b.id) ?? 0))
        .map((course) => course.id);

      // Use stored dimensions or defaults
      const width = container.width ?? 400;
      const height = container.height ?? 300;

      const normalized: ContainerShape = {
        id: container.id,
        title: container.title,
        palette_id: container.palette_id ?? null,
        color: container.color,
        width,
        height,
        position,
      };

      const isSelected = selectedContainerIds.includes(normalized.id);
      return {
        id: normalized.id,
        type: "container" as const,
        position: normalized.position,
        data: {
          kind: "container" as const,
          container: normalized,
          onSelect: openInspectorForContainer,
          courseCount: assignedCourseIds.length,
          // Removed grid data - no longer using grid layout
        },
        style: {
          width: normalized.width,
          height: normalized.height,
          zIndex: -1,
        },
        draggable: true,
        selectable: true,
        selected: isSelected,
      } satisfies Node<ContainerNodeData>;
    });

    const containerNodeMap = new Map(containerNodes.map((node) => [node.id, node]));

    const courses = detail.courses;
    const courseNodes: Node<CourseNodeData>[] = courses.map((course) => {
      const parent = remoteAssignments[course.id];
      const hasUnmetPrereqs = course.prerequisites.some((item) => {
        const prereq = courses.find((candidate) => candidate.id === item.course_id);
        return !prereq || prereq.status !== "completed";
      });

      const isSelected = selectedCourseIds.includes(course.id);

      // Simplified: courses use their stored positions, whether inside or outside containers
      // If they have a parent, we still track it, but don't restrict positioning
      if (parent && containerNodeMap.has(parent)) {
        const containerNode = containerNodeMap.get(parent)!;
        // For courses inside containers, use exact stored positions - NO SNAPPING
        // The stored position is absolute, convert to relative for React Flow
        const absolutePosition = {
          x: Number.isFinite(course.position_x) ? course.position_x : containerNode.position.x + 50,
          y: Number.isFinite(course.position_y)
            ? course.position_y
            : containerNode.position.y + 100,
        };
        const relativePosition = {
          x: absolutePosition.x - containerNode.position.x,
          y: absolutePosition.y - containerNode.position.y,
        };
        return {
          id: course.id,
          type: "course",
          position: relativePosition,
          positionAbsolute: absolutePosition,
          data: {
            kind: "course",
            course,
            hasUnmetPrereqs,
            onSelect: openInspectorForCourse,
          },
          parentNode: parent,
          // Removed: extent: "parent" - allows free positioning even within containers
          // Removed: expandParent - no auto-resizing of containers
          style: { zIndex: 1 },
          draggable: true,
          selectable: true,
          selected: isSelected,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        } satisfies Node<CourseNodeData>;
      }

      const snapped = snapPoint({
        x: Number.isFinite(course.position_x) ? course.position_x : 0,
        y: Number.isFinite(course.position_y) ? course.position_y : 0,
      });

      return {
        id: course.id,
        type: "course",
        position: snapped,
        data: {
          kind: "course",
          course,
          hasUnmetPrereqs,
          onSelect: openInspectorForCourse,
        },
        style: { zIndex: 1 },
        draggable: true,
        selectable: true,
        selected: isSelected,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      } satisfies Node<CourseNodeData>;
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
          style: {
            stroke: unmet ? "#f97316" : "#74809a",
            strokeWidth: unmet ? 2.6 : 2,
            opacity: 0.95,
          },
        });
      });
    });

    const nextNodes = [...containerNodes, ...courseNodes];
    setNodes(nextNodes);
    setEdges(edgesList);

    // Update nodesMapRef for O(1) lookups
    const nextNodesMap = new Map<string, Node<EditorNodeData>>();
    nextNodes.forEach((node) => nextNodesMap.set(node.id, node));
    nodesMapRef.current = nextNodesMap;

    historyRef.current = [];
    futureRef.current = [];
    pushHistory();
  }, [
    detailQuery.data,
    detailQuery.dataUpdatedAt,
    openInspectorForContainer,
    openInspectorForCourse,
    pushHistory,
    selectedCourseIds,
    selectedContainerIds,
    setEdges,
    setNodes,
    theme,
    persistAssignmentsSafe,
  ]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeInternal(changes);
      // Removed: dimension change detection and auto-persist for containers
    },
    [onNodesChangeInternal]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeInternal(changes);
    },
    [onEdgesChangeInternal]
  );

  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const courseIds = params.nodes
        .filter((node) => node.type === "course")
        .map((node) => node.id);
      const containerIds = params.nodes
        .filter((node) => node.type === "container")
        .map((node) => node.id);
      const edgeIds = params.edges.map((edge) => edge.id);

      if (courseIds.length === 0 && containerIds.length === 0 && edgeIds.length === 0) {
        clearSelection();
        return;
      }

      applySelection({
        courses: courseIds,
        containers: containerIds,
        edges: edgeIds,
      });
    },
    [applySelection, clearSelection]
  );

  const reactFlowToolbarActions = useMemo(
    () => ({
      undo: () => {
        if (historyRef.current.length === 0) {
          toast("No more actions to undo", { duration: 2000 });
          return;
        }
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

        // Sync nodesMapRef
        const nextNodesMap = new Map<string, Node<EditorNodeData>>();
        previous.nodes.forEach((node) => nextNodesMap.set(node.id, node));
        nodesMapRef.current = nextNodesMap;

        toast.success("Action undone", { duration: 2000 });

        setTimeout(() => {
          void persistAssignmentsSafe(previous.assignments);
          scheduleContainerPersistence();
        }, 0);
      },
      redo: () => {
        if (futureRef.current.length === 0) {
          toast("No more actions to redo", { duration: 2000 });
          return;
        }
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

        // Sync nodesMapRef
        const nextNodesMap = new Map<string, Node<EditorNodeData>>();
        next.nodes.forEach((node) => nextNodesMap.set(node.id, node));
        nodesMapRef.current = nextNodesMap;

        toast.success("Action redone", { duration: 2000 });

        setTimeout(() => {
          void persistAssignmentsSafe(next.assignments);
          scheduleContainerPersistence();
        }, 0);
      },
    }),
    [persistAssignmentsSafe, scheduleContainerPersistence, setCourseAssignments, setEdges, setNodes]
  );

  const handleNodeDrag = useCallback(() => {
    // No collision detection - allow free dragging
  }, []);

  const handleNodeDragStart = useCallback(() => {
    // No collision detection - allow free dragging
  }, []);

  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node<EditorNodeData>) => {
      if (node.type === "container") {
        const snapped = snapPoint(node.position);

        // Update container position and calculate new absolute positions for children
        updateNodesWithMap((prev) => {
          const adjusted = [...prev];
          const containerIndex = adjusted.findIndex(
            (candidate) => candidate.id === node.id && candidate.type === "container"
          );

          if (containerIndex !== -1) {
            const existing = adjusted[containerIndex] as Node<ContainerNodeData>;
            adjusted[containerIndex] = {
              ...existing,
              position: snapped,
              // Note: container.position is redundant with node.position, not updating data
            } satisfies Node<ContainerNodeData>;

            // CRITICAL FIX: Get child positions from CURRENT React Flow state (prev), not stale nodesRef
            // When container is dragged, React Flow updates both container AND children positions
            // We must read the updated child positions from the current state during this render
            // NOTE: React Flow sets parentId automatically when parentNode is specified
            const childCourses = prev.filter(
              (n) => n.type === "course" && (n.parentId === node.id || n.parentNode === node.id)
            ) as Node<CourseNodeData>[];

            if (childCourses.length > 0) {
              childCourses.forEach((childNode) => {
                // Child positions in React Flow are relative to parent
                // Calculate new absolute position using the current relative position + new container position
                const newAbsolutePosition = {
                  x: childNode.position.x + snapped.x,
                  y: childNode.position.y + snapped.y,
                };
                // Queue update for batch processing - won't trigger cache update
                pendingCourseUpdatesRef.current.set(childNode.id, newAbsolutePosition);
              });
              scheduleCoursePositionUpdates();
            }
          }

          return adjusted;
        });

        scheduleContainerPersistence();
        pushHistory();
        return;
      }

      if (node.type === "course") {
        // For nodes inside containers, positions in React Flow are relative to parent
        // But we save ABSOLUTE positions to the database for consistency
        const isInContainer = Boolean(node.parentId || node.parentNode);

        let absolutePosition: { x: number; y: number };
        if (isInContainer) {
          // CRITICAL FIX: Use current nodes state, not nodesRef which might be stale
          // OPTIMIZATION: Use Map for O(1) lookup instead of O(n) array search
          const parentNodeId = node.parentId || node.parentNode;
          const parentNode = nodesMapRef.current.get(parentNodeId || "");
          if (parentNode) {
            absolutePosition = {
              x: node.position.x + parentNode.position.x,
              y: node.position.y + parentNode.position.y,
            };
          } else {
            // Fallback if parent not found - log warning and treat as top-level
            console.warn(
              `Parent container ${parentNodeId} not found for course ${node.id}, treating as top-level node`
            );
            absolutePosition = snapPoint(node.position);
          }
        } else {
          // Top-level nodes: snap to grid
          absolutePosition = snapPoint(node.position);
          // Update position to snapped value for top-level nodes
          updateNodesWithMap((prev) =>
            prev.map((candidate) =>
              candidate.id === node.id && candidate.type === "course"
                ? ({
                    ...candidate,
                    position: absolutePosition,
                  } as Node<CourseNodeData>)
                : candidate
            )
          );
        }

        // Queue position update for batch processing - reduces backend load
        pendingCourseUpdatesRef.current.set(node.id, absolutePosition);
        scheduleCoursePositionUpdates();

        pushHistory();
      }
    },
    [pushHistory, scheduleContainerPersistence, scheduleCoursePositionUpdates, updateNodesWithMap]
  );

  const handleNodeClick = useCallback(
    (_event: unknown, node: Node<EditorNodeData>) => {
      if (node.type !== "course" && node.type !== "container") {
        return;
      }

      const type = node.type === "course" ? "course" : "container";
      const isSingleCourseSelection =
        type === "course" &&
        selectedCourseIds.length === 1 &&
        selectedCourseIds[0] === node.id &&
        selectedContainerIds.length === 0;
      const isSingleContainerSelection =
        type === "container" &&
        selectedContainerIds.length === 1 &&
        selectedContainerIds[0] === node.id &&
        selectedCourseIds.length === 0;
      const isSingleSelection = isSingleCourseSelection || isSingleContainerSelection;

      if (!isSingleSelection) {
        rememberClick(type, node.id);
        return;
      }

      if (
        lastClickedTarget &&
        lastClickedTarget.type === type &&
        lastClickedTarget.id === node.id
      ) {
        toggleSelectionDetail(type, node.id);
      } else {
        rememberClick(type, node.id);
      }
    },
    [
      lastClickedTarget,
      rememberClick,
      selectedContainerIds,
      selectedCourseIds,
      toggleSelectionDetail,
    ]
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
    setIsMenuOpen(false);
  }, [clearSelection]);

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
        toast.success("Prerequisite added");
      } catch (error) {
        console.error("Failed to add prerequisite", error);
        toast.error("Failed to add prerequisite");
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
          toast.error("Failed to remove prerequisite");
        }
      });
      await Promise.all(tasks);
      setTimeout(() => pushHistory(), 0);

      if (edgesToDelete.length > 0) {
        toast.success(
          edgesToDelete.length === 1
            ? "Prerequisite removed"
            : `${edgesToDelete.length} prerequisites removed`
        );
      }
    },
    [detailQuery.data?.courses, pushHistory, updatePrerequisitesMutation]
  );

  const handleAssignContainer = useCallback(
    (courseId: string, containerId: string | "") => {
      setCourseAssignments((prev) => {
        const previousParent = prev[courseId] ?? null;
        const nextParent = containerId ? containerId : null;
        const nextAssignments = { ...prev };
        if (!nextParent) {
          delete nextAssignments[courseId];
        } else {
          nextAssignments[courseId] = nextParent;
        }

        void persistAssignmentsSafe(nextAssignments);

        updateNodesWithMap((prevNodes) =>
          reflowAfterAssignment(prevNodes, courseId, previousParent, nextParent)
        );

        setTimeout(() => {
          pushHistory();
          scheduleContainerPersistence();
        }, 0);

        return nextAssignments;
      });
    },
    [
      persistAssignmentsSafe,
      pushHistory,
      reflowAfterAssignment,
      scheduleContainerPersistence,
      updateNodesWithMap,
    ]
  );

  const handleAddContainer = useCallback(() => {
    const newId = randomId();
    const existingContainers = nodesRef.current.filter((node) => node.type === "container");
    const nextIndex = existingContainers.length + 1;
    const palette = CONTAINER_PALETTE[Math.floor(Math.random() * CONTAINER_PALETTE.length)];

    // Simplified: just offset new containers by a fixed amount
    const basePosition = snapPoint({
      x: existingContainers.length * 500,
      y: existingContainers.length * 400,
    });

    // Use default container size
    const container: ContainerShape = {
      id: newId,
      title: `Group ${nextIndex}`,
      palette_id: palette.id,
      color: palette.light.fill,
      width: 400,
      height: 300,
      position: basePosition,
    };
    updateNodesWithMap((nds) => [
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
          courseCount: 0,
          grid: { columns: 1, rows: 1 },
        },
        style: {
          width: container.width,
          height: container.height,
          zIndex: -1,
        },
        draggable: true,
        selectable: true,
      },
    ]);
    setTimeout(() => {
      pushHistory();
      scheduleContainerPersistence();
    }, 0);

    toast.success(`Created ${container.title}`);
  }, [
    openInspectorForContainer,
    pushHistory,
    scheduleContainerPersistence,
    updateNodesWithMap,
    theme,
  ]);

  const handleUpdateContainer = useCallback(
    (containerId: string, updates: Partial<ContainerShape>) => {
      updateNodesWithMap((nds) =>
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
          return {
            ...node,
            data: {
              ...data,
              container: merged,
            },
          };
        })
      );
      setTimeout(() => {
        pushHistory();
        scheduleContainerPersistence();
      }, 0);
    },
    [pushHistory, scheduleContainerPersistence, updateNodesWithMap]
  );

  const handleDeleteSelection = useCallback(async () => {
    loading.start(LoadingOperations.DELETE_NODES);

    const selectedNodes = nodesRef.current.filter((node) => node.selected);
    const courseNodesToDelete = selectedNodes.filter((node) => node.type === "course");
    const containerNodesToDelete = selectedNodes.filter((node) => node.type === "container");

    // Save state for rollback
    const previousAssignments = { ...courseAssignments };
    const previousNodes = [...nodesRef.current];
    const previousEdges = [...edgesRef.current];

    let removedContainer = false;
    let deletedCount = 0;
    let failedCount = 0;

    // Optimistic update: Remove from cache immediately
    if (courseNodesToDelete.length > 0) {
      const courseIdsToDelete = courseNodesToDelete.map((node) => node.id);
      updateGraphCache((draft) => {
        draft.courses = draft.courses.filter((c) => !courseIdsToDelete.includes(c.id));
      });
    }

    // Remove containers from UI immediately
    for (const node of containerNodesToDelete) {
      const containerId = node.id;
      setCourseAssignments((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((courseId) => {
          if (next[courseId] === containerId) {
            delete next[courseId];
          }
        });
        void persistAssignmentsSafe(next);
        return next;
      });
      updateNodesWithMap((nds) => nds.filter((candidate) => candidate.id !== containerId));
      removedContainer = true;
    }

    // Remove edges immediately
    if (selectedEdgeIds.length > 0) {
      setEdges((eds) => eds.filter((edge) => !selectedEdgeIds.includes(edge.id)));
    }

    try {
      // Actually delete courses from backend
      for (const node of courseNodesToDelete) {
        try {
          await deleteCourseMutation.mutateAsync(node.id);
          deletedCount++;
        } catch (error) {
          console.error("Failed to delete course", error);
          failedCount++;
        }
      }

      // Delete edges
      if (selectedEdgeIds.length > 0) {
        const edgesToDelete = previousEdges.filter((edge) => selectedEdgeIds.includes(edge.id));
        await handleEdgesDelete(edgesToDelete);
      }

      closeInspector();

      // Show feedback to user
      const totalDeleted = deletedCount + containerNodesToDelete.length;
      if (totalDeleted > 0 && failedCount === 0) {
        toast.success(
          `Deleted ${totalDeleted} ${totalDeleted === 1 ? "item" : "items"} successfully`
        );
      } else if (failedCount > 0) {
        toast.error(
          `Failed to delete ${failedCount} ${failedCount === 1 ? "item" : "items"}. Rolling back changes.`,
          { duration: 5000 }
        );

        // Rollback on error
        updateGraphCache((draft) => {
          const currentCourseIds = new Set(draft.courses.map((c) => c.id));
          const deletedCourses = courseNodesToDelete
            .map((node) => detailQuery.data?.courses.find((c) => c.id === node.id))
            .filter(Boolean);

          deletedCourses.forEach((course) => {
            if (!currentCourseIds.has(course!.id)) {
              draft.courses.push(course!);
            }
          });
        });
        setCourseAssignments(previousAssignments);
        updateNodesWithMap(() => previousNodes);
        setEdges(() => previousEdges);
      }

      setTimeout(() => {
        pushHistory();
        if (removedContainer) {
          scheduleContainerPersistence();
        }
      }, 0);
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error("Failed to delete items. Rolling back changes.", { duration: 5000 });

      // Rollback all changes
      updateGraphCache((draft) => {
        const currentCourseIds = new Set(draft.courses.map((c) => c.id));
        const deletedCourses = courseNodesToDelete
          .map((node) => detailQuery.data?.courses.find((c) => c.id === node.id))
          .filter(Boolean);

        deletedCourses.forEach((course) => {
          if (!currentCourseIds.has(course!.id)) {
            draft.courses.push(course!);
          }
        });
      });
      setCourseAssignments(previousAssignments);
      updateNodesWithMap(() => previousNodes);
      setEdges(() => previousEdges);
    } finally {
      loading.stop(LoadingOperations.DELETE_NODES);
    }
  }, [
    loading,
    courseAssignments,
    updateGraphCache,
    closeInspector,
    deleteCourseMutation,
    detailQuery,
    handleEdgesDelete,
    persistAssignmentsSafe,
    pushHistory,
    scheduleContainerPersistence,
    selectedEdgeIds,
    setEdges,
    updateNodesWithMap,
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
      toast.success("Graph exported successfully");
    } catch (error) {
      console.error("Failed to export graph", error);
      toast.error("Failed to export graph. Please try again.", {
        duration: 5000,
      });
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
        const { courses, idMap } = normaliseCourses(parsed.courses, generateUuid);
        const containers = normaliseContainers(parsed.graph?.containers, (paletteId, fallback) =>
          storedContainerColor(paletteId, fallback)
        );
        const rawAssignments = parsed.graph?.container_assignments ?? {};
        const assignments = buildAssignments(rawAssignments, idMap);

        const payload = {
          replace_existing: replaceExisting,
          containers,
          container_assignments: assignments,
          courses,
        };

        await submitImportPayload(payload);
        toast.success("Graph imported successfully");
      } catch (error) {
        console.error("Failed to import graph", error);
        toast.error("Import failed. Ensure the file was exported from Course Atlas.", {
          duration: 5000,
        });
      } finally {
        setIsImporting(false);
      }
    },
    [graphId, submitImportPayload]
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
        toast.error("Course code and title are required.", { duration: 3000 });
        return;
      }
      const creditsValue = Number(data.credits);
      if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
        toast.error("Credits must be a positive number.", { duration: 3000 });
        return;
      }

      // Start loading state (#11)
      loading.start(LoadingOperations.CREATE_COURSE);

      // Create temporary ID for optimistic update (#11)
      const tempId = `temp-course-${Date.now()}`;

      // Optimistic update: Add course immediately to cache (#11)
      const optimisticCourse: CourseDetail = {
        id: tempId,
        graph_id: graphId!,
        code,
        title,
        credits: Math.round(creditsValue),
        term: data.term.trim() || null,
        status: data.status,
        is_pass_fail: data.is_pass_fail,
        notes: data.notes.trim() ? data.notes.trim() : null,
        prerequisites: [],
        position_x: 100,
        position_y: 100,
        grade: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      updateGraphCache((draft) => {
        draft.courses.push(optimisticCourse);
      });

      try {
        const realCourse = await createCourseMutation.mutateAsync({
          code,
          title,
          credits: Math.round(creditsValue),
          term: data.term.trim() || null,
          status: data.status,
          is_pass_fail: data.is_pass_fail,
          notes: data.notes.trim() ? data.notes.trim() : null,
        });

        // Replace temp course with real course in cache (#11)
        updateGraphCache((draft) => {
          const index = draft.courses.findIndex((c) => c.id === tempId);
          if (index !== -1) {
            draft.courses[index] = realCourse as CourseDetail;
          }
        });

        toast.success("Course created successfully");
        setIsAddCourseOpen(false);
      } catch (error) {
        console.error("Failed to create course", error);

        // Rollback optimistic update on error (#11)
        updateGraphCache((draft) => {
          draft.courses = draft.courses.filter((c) => c.id !== tempId);
        });

        toast.error("Failed to create course. Please try again.", {
          duration: 5000,
        });
      } finally {
        // Stop loading state (#11)
        loading.stop(LoadingOperations.CREATE_COURSE);
      }
    },
    [createCourseMutation, graphId, loading, updateGraphCache]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // if (event.key === "Delete") {  // causes backspace to close menus instead of deleting
      //   event.preventDefault();
      //   handleDeleteSelection();
      // }
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        closeSelectionDetail();
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
  }, [closeSelectionDetail, handleDeleteSelection, reactFlowToolbarActions]);

  const selectedCourse = useMemo(() => {
    if (selectedCourseIds.length !== 1 || selectedContainerIds.length !== 0) return null;
    const courseId = selectedCourseIds[0];
    const courseNode = nodesRef.current.find(
      (node) => node.id === courseId && node.type === "course"
    );
    return (courseNode?.data as CourseNodeData | undefined)?.course ?? null;
  }, [selectedContainerIds, selectedCourseIds]);

  const selectedContainer = useMemo(() => {
    if (selectedContainerIds.length !== 1 || selectedCourseIds.length !== 0) return null;
    const containerId = selectedContainerIds[0];
    const containerNode = nodesRef.current.find(
      (node) => node.id === containerId && node.type === "container"
    );
    return (containerNode?.data as ContainerNodeData | undefined)?.container ?? null;
  }, [selectedContainerIds, selectedCourseIds]);
  const selectionCount = selectionTotals.courseCount + selectionTotals.containerCount;
  const isMultiSelection = selectionCount > 1;
  const hasSelection = selectionCount > 0;

  const multiSelectionData = useMemo(() => {
    if (!isMultiSelection) return null;

    const allCourses = detailQuery.data?.courses ?? [];
    const containerMap = new Map<string, ContainerShape>();
    nodes.forEach((node) => {
      if (node.type === "container") {
        containerMap.set(node.id, (node.data as ContainerNodeData).container);
      }
    });
    return buildMultiSelectionSummary({
      courses: allCourses,
      selectedCourseIds,
      selectedContainerIds,
      courseAssignments,
      containers: containerMap,
    });
  }, [
    courseAssignments,
    detailQuery.data?.courses,
    isMultiSelection,
    nodes,
    selectedContainerIds,
    selectedCourseIds,
  ]);

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

  const inspectorContent = isMultiSelection ? (
    multiSelectionData ? (
      <MultiSelectionInspector
        groups={multiSelectionData.groups}
        ungroupedCourses={multiSelectionData.ungroupedCourses}
        totals={selectionTotals}
      />
    ) : (
      placeholderPanel
    )
  ) : selectedCourse ? (
    <CourseSidePanel
      course={selectedCourse}
      assignedContainerId={courseAssignments[selectedCourse.id]}
      onChange={handleAssignContainer}
      containerOptions={containerOptions}
      onClose={closeInspector}
      loading={loading}
      updateGraphCache={updateGraphCache}
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
      ? "rounded-full border border-blue-400/50 bg-gradient-to-br from-blue-500/30 to-blue-600/20 px-4 py-2.5 text-sm font-semibold text-blue-100 shadow-[0_8px_32px_-12px_rgba(59,130,246,0.6)] backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_40px_-12px_rgba(59,130,246,0.8)] hover:border-blue-400/70 hover:from-blue-500/40 hover:to-blue-600/30"
      : "rounded-full border border-blue-400/60 bg-gradient-to-br from-blue-500/90 to-blue-600/80 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_32px_-12px_rgba(59,130,246,0.4)] backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_40px_-12px_rgba(59,130,246,0.6)] hover:border-blue-500/70 hover:from-blue-600/95 hover:to-blue-700/85";
  const graphActionPanelClasses =
    theme === "dark"
      ? "min-w-[280px] rounded-2xl border border-slate-700/60 bg-slate-950/90 p-4 text-sm text-slate-100 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      : "min-w-[280px] rounded-2xl border border-slate-300/80 bg-white/98 p-4 text-sm text-slate-800 shadow-[0_32px_64px_-24px_rgba(15,23,42,0.25)] backdrop-blur-xl";
  const menuItemClasses =
    theme === "dark"
      ? "w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-900/70 focus:outline-none"
      : "w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus:outline-none";
  const menuItemDangerClasses =
    theme === "dark" ? "text-rose-300 hover:bg-rose-500/10" : "text-rose-600 hover:bg-rose-50";
  const graphActionItemClasses =
    theme === "dark"
      ? "w-full rounded-lg bg-slate-900/50 px-4 py-2.5 text-left font-medium text-slate-200 transition-all duration-150 hover:bg-slate-800/70 hover:pl-5 focus:outline-none active:scale-[0.98]"
      : "w-full rounded-lg bg-slate-100/80 px-4 py-2.5 text-left font-medium text-slate-800 transition-all duration-150 hover:bg-slate-200/90 hover:pl-5 focus:outline-none active:scale-[0.98]";
  const handleOpenDetailsSurface = useCallback(() => {
    if (selectionCount === 0) return;
    if (isMultiSelection) {
      openAggregateDetail();
      return;
    }
    if (selectedCourse) {
      openSelectionDetail("course", selectedCourse.id);
      return;
    }
    if (selectedContainer) {
      openSelectionDetail("container", selectedContainer.id);
    }
  }, [
    isMultiSelection,
    openAggregateDetail,
    openSelectionDetail,
    selectedContainer,
    selectedCourse,
    selectionCount,
  ]);
  const shouldShowInspectorDrawer = !isLargeViewport && isDetailOpen && hasSelection;
  const containerLabel = selectionTotals.containerCount === 1 ? "container" : "containers";
  const courseLabel = selectionTotals.courseCount === 1 ? "node" : "nodes";
  const defaultInfoBubble = (
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
  const infoBubbleContent = hasSelection ? (
    isMultiSelection ? (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
          Multiple selected
        </p>
        <h2 className="mt-3 text-xl font-semibold">
          {selectionTotals.containerCount} {containerLabel} – {selectionTotals.courseCount}{" "}
          {courseLabel}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Open the details surface to review this selection.
        </p>
      </div>
    ) : selectedCourse ? (
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
    ) : selectedContainer ? (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
          Container selected
        </p>
        <h2 className="mt-3 text-xl font-semibold">{selectedContainer.title}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {selectedContainerMemberCount} course{selectedContainerMemberCount === 1 ? "" : "s"}
        </p>
      </div>
    ) : (
      defaultInfoBubble
    )
  ) : (
    defaultInfoBubble
  );

  const menuItems: Array<{ label: string; action: () => void; danger?: boolean }> = [];
  if (isMultiSelection) {
    menuItems.push({
      label: "Open details",
      action: () => {
        openAggregateDetail();
        setIsMenuOpen(false);
      },
    });
    menuItems.push({
      label: loading.is(LoadingOperations.DELETE_NODES) ? "Deleting..." : "Delete selection",
      action: () => {
        if (loading.is(LoadingOperations.DELETE_NODES)) return;
        void handleDeleteSelection().finally(() => {
          setIsMenuOpen(false);
          closeSelectionDetail();
        });
      },
      danger: true,
    });
  } else if (selectedCourse) {
    menuItems.push({
      label: "Open details",
      action: () => {
        openSelectionDetail("course", selectedCourse.id);
        setIsMenuOpen(false);
      },
    });
    menuItems.push({
      label: loading.is(LoadingOperations.DELETE_NODES) ? "Deleting..." : "Delete course",
      action: () => {
        if (loading.is(LoadingOperations.DELETE_NODES)) return;
        void handleDeleteSelection().finally(() => {
          setIsMenuOpen(false);
          closeSelectionDetail();
        });
      },
      danger: true,
    });
  } else if (selectedContainer) {
    menuItems.push({
      label: "Open details",
      action: () => {
        openSelectionDetail("container", selectedContainer.id);
        setIsMenuOpen(false);
      },
    });
    menuItems.push({
      label: loading.is(LoadingOperations.DELETE_NODES) ? "Deleting..." : "Delete container",
      action: () => {
        if (loading.is(LoadingOperations.DELETE_NODES)) return;
        void handleDeleteSelection().finally(() => {
          setIsMenuOpen(false);
          closeSelectionDetail();
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
    ],
    [
      canvasFitViewPadding,
      handleAddContainer,
      handleAutoLayoutAll,
      handleExportGraph,
      handleImportClick,
      handleResetLargeSample,
      handleResetSmallSample,
      isExporting,
      isImporting,
      reactFlowToolbarActions,
    ]
  );

  const handleNodeDoubleClick = useCallback(
    (_event: unknown, node: Node<EditorNodeData>) => {
      if (node.type === "course") {
        openSelectionDetail("course", node.id);
      } else if (node.type === "container") {
        openSelectionDetail("container", node.id);
      } else {
        return;
      }
      setIsMenuOpen(false);
    },
    [openSelectionDetail]
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
        isSubmitting={loading.is(LoadingOperations.CREATE_COURSE)}
      />

      <div className={workspaceClasses}>
        <div className="flex h-full flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch lg:gap-8">
          <div
            className="relative flex-1 min-h-[520px]"
            style={
              {
                "--node-blur": `${nodeBlur}px`,
              } as React.CSSProperties
            }
          >
            {detailQuery.isLoading ? (
              <GraphEditorSkeleton />
            ) : (
              <>
                <ReactFlowProvider>
                  <GraphEditorCanvas
                    theme={theme}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onSelectionChange={handleSelectionChange}
                    onNodeClick={handleNodeClick}
                    onPaneClick={handlePaneClick}
                    onNodeDrag={handleNodeDrag}
                    onNodeDragStart={handleNodeDragStart}
                    onNodeDragStop={handleNodeDragStop}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onConnect={handleConnect}
                    onEdgesDelete={handleEdgesDelete}
                    onReady={(instance) => {
                      reactFlowInstanceRef.current = instance;
                      instance.fitView({ padding: canvasFitViewPadding });
                    }}
                    minZoom={canvasMinZoom}
                    showMiniMap={showMiniMap}
                    gridStyle={gridStyle}
                    gridDotSize={gridDotSize}
                    gridLineWidth={gridLineWidth}
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

                  <div className="pointer-events-auto absolute right-6 top-6 z-20 flex flex-row items-start gap-3">
                    <div className="relative flex flex-col items-end">
                      <button
                        type="button"
                        aria-expanded={isSettingsOpen}
                        onClick={() => {
                          setIsSettingsOpen((prev) => !prev);
                          setIsGraphActionsOpen(false);
                        }}
                        className={graphActionsButtonClasses}
                      >
                        ⚙️ Settings
                      </button>
                      {isSettingsOpen ? (
                        <div className={`${graphActionPanelClasses} absolute top-full mt-3`}>
                          <div className="space-y-5">
                            {/* Appearance Section */}
                            <div className="space-y-3">
                              <div
                                className={`pb-2 text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                              >
                                Appearance
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🎨</span>
                                  <span className="text-sm font-medium">Theme</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => theme === "dark" && handleThemeToggle()}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                      theme === "light"
                                        ? "bg-gradient-to-br from-amber-400/95 to-orange-500/95 text-white border border-orange-400 shadow-md"
                                        : theme === "dark"
                                          ? "bg-slate-800/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/40 hover:text-slate-300"
                                          : "bg-slate-200 text-slate-700 border border-slate-400 hover:bg-slate-300"
                                    }`}
                                  >
                                    ☀️ Light
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => theme === "light" && handleThemeToggle()}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                      theme === "dark"
                                        ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-indigo-200 border border-indigo-400/50 shadow-sm"
                                        : "bg-slate-200 text-slate-700 border border-slate-400 hover:bg-slate-300"
                                    }`}
                                  >
                                    🌙 Dark
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">⊞</span>
                                  <span className="text-sm font-medium">Grid Style</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setGridStyle("dots")}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                      gridStyle === "dots"
                                        ? theme === "dark"
                                          ? "bg-blue-500/30 text-blue-200 border border-blue-400/50 shadow-sm"
                                          : "bg-gradient-to-br from-blue-500/95 to-blue-600/95 text-white border border-blue-500 shadow-md"
                                        : theme === "dark"
                                          ? "bg-slate-800/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/40"
                                          : "bg-slate-200 text-slate-700 border border-slate-400 hover:bg-slate-300"
                                    }`}
                                  >
                                    •• Dots
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGridStyle("lines")}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                      gridStyle === "lines"
                                        ? theme === "dark"
                                          ? "bg-blue-500/30 text-blue-200 border border-blue-400/50 shadow-sm"
                                          : "bg-gradient-to-br from-blue-500/95 to-blue-600/95 text-white border border-blue-500 shadow-md"
                                        : theme === "dark"
                                          ? "bg-slate-800/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/40"
                                          : "bg-slate-200 text-slate-700 border border-slate-400 hover:bg-slate-300"
                                    }`}
                                  >
                                    ⊞ Lines
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Divider */}
                            <div
                              className={`border-t ${theme === "dark" ? "border-slate-700/50" : "border-slate-300"}`}
                            />

                            {/* Features Section */}
                            <div className="space-y-3">
                              <div
                                className={`pb-2 text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                              >
                                Features
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🗺️</span>
                                  <span className="text-sm font-medium">Minimap</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowMiniMap((prev) => !prev)}
                                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 min-w-[85px] ${
                                    showMiniMap
                                      ? theme === "dark"
                                        ? "bg-gradient-to-br from-emerald-500/30 to-green-500/30 text-emerald-200 border border-emerald-400/50 shadow-sm"
                                        : "bg-gradient-to-br from-emerald-500/95 to-green-600/95 text-white border border-emerald-500 shadow-md"
                                      : theme === "dark"
                                        ? "bg-slate-800/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/40"
                                        : "bg-slate-200 text-slate-700 border border-slate-400 hover:bg-slate-300"
                                  }`}
                                >
                                  {showMiniMap ? "✓ Shown" : "Hidden"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Grid Thickness Controls */}
                          <div
                            className={`${
                              theme === "dark"
                                ? "bg-slate-800/40 border-slate-700/50"
                                : "bg-white/60 border-slate-200"
                            } backdrop-blur-sm rounded-xl p-5 border shadow-md`}
                          >
                            <h3
                              className={`text-sm font-semibold mb-4 ${
                                theme === "dark" ? "text-slate-200" : "text-slate-800"
                              }`}
                            >
                              Grid Thickness
                            </h3>
                            <div className="space-y-4">
                              {/* Dot Size Slider - Only show when dots are active */}
                              {gridStyle === "dots" && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label
                                      htmlFor="grid-dot-size"
                                      className="text-sm font-medium flex items-center gap-2"
                                    >
                                      <span>⚫</span>
                                      <span>Dot Size</span>
                                    </label>
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                        theme === "dark"
                                          ? "bg-slate-700/50 text-slate-300"
                                          : "bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {gridDotSize.toFixed(1)}px
                                    </span>
                                  </div>
                                  <input
                                    id="grid-dot-size"
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={gridDotSize}
                                    onChange={(e) => setGridDotSize(parseFloat(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                      background:
                                        theme === "dark"
                                          ? "linear-gradient(to right, #475569 0%, #64748b 100%)"
                                          : "linear-gradient(to right, #cbd5e1 0%, #94a3b8 100%)",
                                    }}
                                  />
                                </div>
                              )}

                              {/* Line Width Slider - Only show when lines are active */}
                              {gridStyle === "lines" && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label
                                      htmlFor="grid-line-width"
                                      className="text-sm font-medium flex items-center gap-2"
                                    >
                                      <span>━</span>
                                      <span>Line Width</span>
                                    </label>
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                        theme === "dark"
                                          ? "bg-slate-700/50 text-slate-300"
                                          : "bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {gridLineWidth.toFixed(1)}px
                                    </span>
                                  </div>
                                  <input
                                    id="grid-line-width"
                                    type="range"
                                    min="0.5"
                                    max="5"
                                    step="0.1"
                                    value={gridLineWidth}
                                    onChange={(e) => setGridLineWidth(parseFloat(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                      background:
                                        theme === "dark"
                                          ? "linear-gradient(to right, #475569 0%, #64748b 100%)"
                                          : "linear-gradient(to right, #cbd5e1 0%, #94a3b8 100%)",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Node Styling Controls */}
                          <div
                            className={`${
                              theme === "dark"
                                ? "bg-slate-800/40 border-slate-700/50"
                                : "bg-white/60 border-slate-200"
                            } backdrop-blur-sm rounded-xl p-5 border shadow-md`}
                          >
                            <h3
                              className={`text-sm font-semibold mb-4 ${
                                theme === "dark" ? "text-slate-200" : "text-slate-800"
                              }`}
                            >
                              Node Styling
                            </h3>
                            <div className="space-y-4">
                              {/* Node Blur Slider */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="node-blur"
                                    className="text-sm font-medium flex items-center gap-2"
                                  >
                                    <span>🌫️</span>
                                    <span>Background Blur</span>
                                  </label>
                                  <span
                                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                      theme === "dark"
                                        ? "bg-slate-700/50 text-slate-300"
                                        : "bg-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {nodeBlur}px
                                  </span>
                                </div>
                                <input
                                  id="node-blur"
                                  type="range"
                                  min="0"
                                  max="20"
                                  step="1"
                                  value={nodeBlur}
                                  onChange={(e) => setNodeBlur(parseInt(e.target.value))}
                                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    background:
                                      theme === "dark"
                                        ? "linear-gradient(to right, #475569 0%, #64748b 100%)"
                                        : "linear-gradient(to right, #cbd5e1 0%, #94a3b8 100%)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="relative flex flex-col items-end">
                      <button
                        type="button"
                        aria-expanded={isGraphActionsOpen}
                        onClick={() => {
                          setIsGraphActionsOpen((prev) => !prev);
                          setIsSettingsOpen(false);
                        }}
                        className={graphActionsButtonClasses}
                      >
                        Graph actions
                      </button>
                      {isGraphActionsOpen ? (
                        <div className={`${graphActionPanelClasses} absolute top-full mt-3`}>
                          <div className="space-y-1.5">
                            {graphActionItems.map((item, index) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={item.action}
                                disabled={item.disabled}
                                className={`${graphActionItemClasses} ${
                                  item.disabled ? "cursor-not-allowed opacity-40" : ""
                                } ${index === 0 ? "" : ""}`}
                              >
                                <span className="flex items-center justify-between gap-3">
                                  <span>{item.label}</span>
                                  {!item.disabled && (
                                    <span
                                      className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
                                    >
                                      →
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenDetailsSurface}
                    disabled={!canOpenInspector}
                    className="pointer-events-auto absolute bottom-6 right-6 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
                  >
                    {canOpenInspector ? "Open details" : "Select an item"}
                  </button>

                  {isLargeViewport && isDetailOpen && hasSelection ? (
                    <div className="pointer-events-auto absolute right-6 top-32 z-20 w-[24rem] max-w-full">
                      <div className={inspectorBubbleClasses}>
                        <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                          <span>Details</span>
                          <button
                            type="button"
                            onClick={() => closeSelectionDetail()}
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
              </>
            )}
          </div>
        </div>
      </div>

      {shouldShowInspectorDrawer ? (
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

export function GraphEditorPage() {
  return (
    <GraphSelectionProvider>
      <GraphEditorPageInner />
    </GraphSelectionProvider>
  );
}

type GraphEditorCanvasProps = {
  nodes: Node<EditorNodeData>[];
  edges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  onSelectionChange: (params: OnSelectionChangeParams) => void;
  onNodeClick: (event: unknown, node: Node<EditorNodeData>) => void;
  onPaneClick: () => void;
  onNodeDrag: (event: unknown, node: Node<EditorNodeData>) => void;
  onNodeDragStart: (event: unknown, node: Node<EditorNodeData>) => void;
  onNodeDragStop: (event: unknown, node: Node<EditorNodeData>) => void;
  onNodeDoubleClick: (event: unknown, node: Node<EditorNodeData>) => void;
  onConnect: (connection: Connection) => void;
  onEdgesDelete: (edges: Edge[]) => void;
  onReady: (instance: ReactFlowInstance) => void;
  minZoom: number;
  theme: ThemeMode;
  showMiniMap: boolean;
  gridStyle: "dots" | "lines";
  gridDotSize: number;
  gridLineWidth: number;
};

function GraphEditorCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onSelectionChange,
  onNodeClick,
  onPaneClick,
  onNodeDrag,
  onNodeDragStart,
  onNodeDragStop,
  onNodeDoubleClick,
  onConnect,
  onEdgesDelete,
  onReady,
  minZoom,
  theme,
  showMiniMap,
  gridStyle,
  gridDotSize,
  gridLineWidth,
}: GraphEditorCanvasProps) {
  const themeTokens = THEME_TOKENS[theme];
  const flowBackground = "";
  const canvasStyle = useMemo(
    () => ({
      backgroundColor: theme === "dark" ? "#11151c" : "#f5f7fa",
    }),
    [theme]
  );
  const miniMapStyle = useMemo(
    () => ({
      height: 168,
      width: 220,
      background: theme === "dark" ? "#1b2230" : "#ffffff",
      borderRadius: 6,
      boxShadow:
        theme === "dark"
          ? "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02) inset"
          : "0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05) inset",
      border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
      bottom: 16,
      left: 16,
    }),
    [theme]
  );
  const controlsStyle = useMemo(
    () => ({
      background: theme === "dark" ? "#1b2230" : "#ffffff",
      borderRadius: 12,
      boxShadow:
        theme === "dark"
          ? "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02) inset"
          : "0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05) inset",
      border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
    }),
    [theme]
  );
  const miniMapNodeColor = useCallback(
    (node: Node<EditorNodeData>) => {
      if (node.type === "container") {
        const data = node.data as ContainerNodeData | undefined;
        if (data?.container) {
          const visuals = resolveContainerVisuals(data.container, theme);
          return withAlpha(visuals.fill, theme === "dark" ? 0.7 : 0.5);
        }
        return themeTokens.minimap.containerFill;
      }

      if (node.type === "course") {
        const data = node.data as CourseNodeData | undefined;
        if (data) {
          const statusKey = resolveCourseStatusKey(data.course, data.hasUnmetPrereqs);
          return withAlpha(themeTokens.status[statusKey].bg, theme === "dark" ? 0.9 : 0.7);
        }
      }

      return themeTokens.minimap.courseFill;
    },
    [theme, themeTokens]
  );
  const miniMapNodeStrokeColor = useCallback(
    (node: Node<EditorNodeData>) => {
      if (node.type === "container") {
        const data = node.data as ContainerNodeData | undefined;
        if (data?.container) {
          const visuals = resolveContainerVisuals(data.container, theme);
          return withAlpha(visuals.border, theme === "dark" ? 0.95 : 0.75);
        }
        return themeTokens.minimap.containerStroke;
      }

      if (node.type === "course") {
        const data = node.data as CourseNodeData | undefined;
        if (data) {
          const statusKey = resolveCourseStatusKey(data.course, data.hasUnmetPrereqs);
          return themeTokens.status[statusKey].border;
        }
      }

      return themeTokens.minimap.courseStroke;
    },
    [theme, themeTokens]
  );
  const miniMapNodeClassName = useCallback(
    (node: Node<EditorNodeData>) =>
      node.type === "container"
        ? "minimap-node minimap-node--container"
        : "minimap-node minimap-node--course",
    []
  );
  const MiniMapNodeComponent = useMemo(() => {
    const themeMode = theme;
    return function MiniMapNodeComponent({
      id,
      x,
      y,
      width,
      height,
      borderRadius,
      color,
      strokeColor,
      strokeWidth,
      className,
      onClick,
    }: MiniMapNodeProps) {
      const isCourse = className.includes("minimap-node--course");
      const strokeFallback =
        strokeColor ||
        (isCourse ? themeTokens.minimap.courseStroke : themeTokens.minimap.containerStroke);
      const padding = Math.max(1, Math.min(width, height) * 0.08);
      const headerHeight = Math.max(2, Math.min(height * 0.3, height - padding * 2 - 2));
      const baseRect = (
        <rect
          width={width}
          height={height}
          rx={borderRadius}
          ry={borderRadius}
          fill={color}
          stroke={strokeFallback}
          strokeWidth={strokeWidth}
          className={className}
          onClick={onClick ? (event) => onClick(event, id) : undefined}
        />
      );

      if (!isCourse || width < 12 || height < 12) {
        return <g transform={`translate(${x}, ${y})`}>{baseRect}</g>;
      }

      const headerFill = withAlpha(strokeFallback, themeMode === "dark" ? 0.45 : 0.22);
      const lineColorStrong = withAlpha(strokeFallback, themeMode === "dark" ? 0.55 : 0.35);
      const lineColor = withAlpha(strokeFallback, themeMode === "dark" ? 0.35 : 0.2);

      const bodyWidth = Math.max(4, width - padding * 2);
      const firstLineY = padding + headerHeight + Math.max(1, height * 0.05);
      const lineHeight = Math.max(1.2, height * 0.08);
      const lineGap = Math.max(1, height * 0.06);

      const lines = [
        { width: bodyWidth * 0.95, y: firstLineY, color: lineColorStrong },
        { width: bodyWidth * 0.7, y: firstLineY + lineHeight + lineGap, color: lineColor },
        { width: bodyWidth * 0.85, y: firstLineY + (lineHeight + lineGap) * 2, color: lineColor },
      ].filter((line) => line.y + lineHeight <= height - padding);

      return (
        <g transform={`translate(${x}, ${y})`}>
          {baseRect}
          <rect
            x={padding}
            y={padding}
            width={bodyWidth}
            height={headerHeight}
            rx={Math.min(4, borderRadius)}
            ry={Math.min(4, borderRadius)}
            fill={headerFill}
          />
          {lines.map((line, index) => (
            <rect
              key={`${id}-line-${index}`}
              x={padding}
              y={line.y}
              width={Math.max(3, line.width)}
              height={lineHeight}
              rx={lineHeight / 2}
              ry={lineHeight / 2}
              fill={line.color}
            />
          ))}
        </g>
      );
    };
  }, [theme, themeTokens]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${flowBackground}`}>
      <ReactFlow
        style={canvasStyle}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
        minZoom={minZoom}
        className="h-full w-full"
        defaultEdgeOptions={{ type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } }}
        proOptions={{ hideAttribution: true }}
        onInit={onReady}
        snapToGrid
        snapGrid={[GRID_CONFIG.UNIT, GRID_CONFIG.UNIT]}
      >
        {showMiniMap ? (
          <MiniMap
            pannable
            zoomable
            nodeColor={miniMapNodeColor}
            nodeStrokeColor={miniMapNodeStrokeColor}
            nodeStrokeWidth={1.2}
            nodeClassName={miniMapNodeClassName}
            nodeComponent={MiniMapNodeComponent}
            style={miniMapStyle}
          />
        ) : null}
        <Controls position="bottom-right" showInteractive={false} style={controlsStyle} />
        {gridStyle === "dots" ? (
          <Background
            key="dots"
            variant={BackgroundVariant.Dots}
            gap={20}
            size={gridDotSize}
            color={theme === "dark" ? "#2a3344" : "#dce2ea"}
          />
        ) : (
          <Background
            key="lines"
            variant={BackgroundVariant.Lines}
            gap={24}
            color={theme === "dark" ? "#2a3344" : "#dce2ea"}
            style={{ "--grid-line-width": gridLineWidth } as React.CSSProperties}
          />
        )}
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
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting && <InlineSpinner size={16} />}
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
  loading: ReturnType<typeof useLoadingState>;
  updateGraphCache: (updater: (draft: GraphDetail) => void) => () => void;
};

function CourseSidePanel({
  course,
  assignedContainerId,
  containerOptions,
  onChange,
  onClose,
  loading,
  updateGraphCache,
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

    // Start loading (#11)
    loading.start(LoadingOperations.UPDATE_COURSE);

    // Prepare update payload
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

    // Save previous state for rollback (#11)
    const previousCourse = { ...course };

    // Optimistic update: Update cache immediately (#11)
    updateGraphCache((draft) => {
      const courseIndex = draft.courses.findIndex((c) => c.id === course.id);
      if (courseIndex !== -1) {
        draft.courses[courseIndex] = {
          ...draft.courses[courseIndex],
          title: formState.title,
          code: formState.code,
          term: formState.term || null,
          status: formState.status,
          notes: formState.notes || null,
          is_pass_fail: formState.is_pass_fail,
          grade: formState.grade ? formState.grade : null,
          credits:
            Number.isFinite(creditsValue) && creditsValue >= 0
              ? Math.round(creditsValue)
              : draft.courses[courseIndex].credits,
        };
      }
    });

    try {
      await updateCourseMutation.mutateAsync({
        courseId: course.id,
        data: updatePayload,
      });
      toast.success("Course updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update course", error);

      // Rollback optimistic update on error (#11)
      updateGraphCache((draft) => {
        const courseIndex = draft.courses.findIndex((c) => c.id === course.id);
        if (courseIndex !== -1) {
          draft.courses[courseIndex] = previousCourse;
        }
      });

      toast.error("Failed to update course. Please try again.", {
        duration: 5000,
      });
    } finally {
      // Stop loading (#11)
      loading.stop(LoadingOperations.UPDATE_COURSE);
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
        disabled={loading.is(LoadingOperations.UPDATE_COURSE)}
        className="mt-auto rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading.is(LoadingOperations.UPDATE_COURSE) && <InlineSpinner size={16} />}
        {loading.is(LoadingOperations.UPDATE_COURSE) ? "Saving…" : "Save changes"}
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

type MemberChipProps = {
  member: CourseDetail;
};

function MemberChip({ member }: MemberChipProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [codeOverflows, setCodeOverflows] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        setTitleOverflows(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
      if (codeRef.current) {
        setCodeOverflows(codeRef.current.scrollWidth > codeRef.current.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [member.title, member.code]);

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs shadow-sm transition hover:shadow-md dark:border-slate-600 dark:bg-slate-900/50">
      <div className="flex-1 min-w-0 member-text-container">
        <div
          ref={titleRef}
          className={`member-text-marquee font-semibold text-slate-700 dark:text-slate-200 ${titleOverflows ? "is-overflowing" : ""}`}
        >
          <span data-text={member.title}>{member.title}</span>
        </div>
      </div>
      <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">•</span>
      <div className="flex-1 min-w-0 member-text-container text-right">
        <div
          ref={codeRef}
          className={`member-text-marquee text-slate-600 dark:text-slate-300 ${codeOverflows ? "is-overflowing" : ""}`}
        >
          <span data-text={member.code}>{member.code}</span>
        </div>
      </div>
    </div>
  );
}

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

      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <span>Preview</span>
        <div
          className="overflow-hidden rounded-xl border-2 border-dashed shadow-sm transition"
          style={{
            background: previewVisual.fill,
            borderColor: previewVisual.border,
            boxShadow:
              theme === "dark"
                ? "inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px -4px rgba(0,0,0,0.2)"
                : "inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px -4px rgba(0,0,0,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b-2 border-dashed text-xs font-semibold"
            style={{
              background: `linear-gradient(135deg, ${previewVisual.border}33 0%, ${previewVisual.border}1a 100%)`,
              borderBottomColor: previewVisual.border,
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-slate-700 dark:text-slate-200">{title || "Untitled"}</span>
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold"
              style={{
                background: `${previewVisual.border}66`,
                borderColor: `${previewVisual.border}99`,
                color: "rgba(255,255,255,0.9)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              }}
            >
              {members.length} {members.length === 1 ? "COURSE" : "COURSES"}
            </span>
          </div>
          <div className="p-4 h-24 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
            Container body
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <header className="mb-2 font-medium text-slate-700 dark:text-slate-200">Members</header>
        {members.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag a course into this container to assign it.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((member) => (
              <MemberChip key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>

      {/* <button
        type="submit"
        className="mt-auto rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark"
      >
        Save changes
      </button> */}
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

type MultiSelectionInspectorProps = {
  groups: Array<{
    id: string;
    title: string;
    isSelected: boolean;
    totalCourses: number;
    courses: CourseDetail[];
  }>;
  ungroupedCourses: CourseDetail[];
  totals: {
    containerCount: number;
    courseCount: number;
  };
};

export function MultiSelectionInspector({
  groups,
  ungroupedCourses,
  totals,
}: MultiSelectionInspectorProps) {
  const containerLabel = totals.containerCount === 1 ? "container" : "containers";
  const courseLabel = totals.courseCount === 1 ? "course" : "courses";
  const hasGroups = groups.length > 0;
  const hasUngrouped = ungroupedCourses.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
          Selection summary
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {totals.containerCount} {containerLabel} · {totals.courseCount} {courseLabel}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Containers display their selected courses beneath them for quick review.
        </p>
      </header>

      {hasGroups || hasUngrouped ? (
        <div className="space-y-4">
          {groups.map((group) => {
            const courseCountLabel =
              group.totalCourses === 1 ? "1 course" : `${group.totalCourses} courses`;
            const badgeClasses = group.isSelected
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300";
            const badgeLabel = group.isSelected ? "Selected container" : "Container not selected";
            return (
              <section
                key={group.id}
                className="rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {group.title}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClasses}`}
                    >
                      {badgeLabel}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {courseCountLabel}
                  </span>
                </div>
                {group.courses.length ? (
                  <ul className="mt-3 space-y-1 text-sm">
                    {group.courses.map((course) => (
                      <li key={course.id} className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {course.code}
                        </span>
                        <span className="truncate text-slate-500 dark:text-slate-400">
                          {course.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs italic text-slate-400 dark:text-slate-500">
                    No selected courses in this container.
                  </p>
                )}
              </section>
            );
          })}

          {hasUngrouped ? (
            <section className="rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Ungrouped courses
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {ungroupedCourses.length === 1
                    ? "1 course"
                    : `${ungroupedCourses.length} courses`}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {ungroupedCourses.map((course) => (
                  <li key={course.id} className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {course.code}
                    </span>
                    <span className="truncate text-slate-500 dark:text-slate-400">
                      {course.title}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          The current selection does not include any courses. Choose courses or containers to see
          them listed here.
        </p>
      )}
    </div>
  );
}
