import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";

import { HealthStatusCard } from "../sections/HealthStatusCard";
import {
  type CourseDetail,
  type CoursePrerequisite,
  type CourseStatus,
  useGraphDetailQuery,
} from "../sections/graph-editor/useGraphDetailQuery";
import { useUpdateCourseMutation } from "../sections/graph-editor/useUpdateCourseMutation";
import { useUpdatePrerequisitesMutation } from "../sections/graph-editor/useUpdatePrerequisitesMutation";

import { Skeleton } from "../components/Skeleton";

const defaultPosition = { x: 0, y: 0 };

type CourseNodeData = {
  course: CourseDetail;
  onSelect: (courseId: string) => void;
};

type CourseNodeProps = {
  data: CourseNodeData;
};

function CourseNode({ data }: CourseNodeProps) {
  const { course, onSelect } = data;
  return (
    <div
      className={`pointer-events-none w-60 cursor-pointer rounded-xl border border-slate-300 bg-white p-4 text-left shadow-sm transition ${
        course.status === "completed"
          ? "border-emerald-300 bg-emerald-50"
          : course.status === "in_progress"
            ? "border-sky-300 bg-sky-50"
            : ""
      }`}
      onDoubleClick={() => onSelect(course.id)}
    >
      <h3 className="pointer-events-auto text-base font-semibold text-slate-900">{course.code}</h3>
      <p className="pointer-events-auto text-sm text-slate-600">{course.title}</p>
      <div className="pointer-events-auto mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{course.credits} credits</span>
        <span className="uppercase tracking-wide">{course.status.replace("_", " ")}</span>
      </div>
    </div>
  );
}

const nodeTypes = { course: CourseNode };

export function GraphEditorPage() {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const detailQuery = useGraphDetailQuery(graphId ?? "");
  const updateCourseMutation = useUpdateCourseMutation(graphId ?? "");
  const updatePrerequisitesMutation = useUpdatePrerequisitesMutation(graphId ?? "");

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<CourseNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const coursesById = useMemo(() => {
    const map = new Map<string, CourseDetail>();
    if (detailQuery.data?.courses) {
      detailQuery.data.courses.forEach((course) => map.set(course.id, course));
    }
    return map;
  }, [detailQuery.data?.courses]);

  useEffect(() => {
    if (!detailQuery.data) return;

    const nextNodes: Node<CourseNodeData>[] = detailQuery.data.courses.map((course) => ({
      id: course.id,
      type: "course",
      position: {
        x: Number.isFinite(course.position_x) ? course.position_x : defaultPosition.x,
        y: Number.isFinite(course.position_y) ? course.position_y : defaultPosition.y,
      },
      data: {
        course,
        onSelect: (id: string) => setSelectedCourseId(id),
      },
    }));

    const nextEdges: Edge[] = [];
    detailQuery.data.courses.forEach((course) => {
      course.prerequisites.forEach((prereq) => {
        nextEdges.push({
          id: `${prereq.course_id}->${course.id}`,
          source: prereq.course_id,
          target: course.id,
        });
      });
    });

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [detailQuery.data, setEdges, setNodes]);

  const handleNodeDragStop = async (_: unknown, node: Node<CourseNodeData>) => {
    const { id, position } = node;
    const course = coursesById.get(id);
    if (!course) return;

    try {
      await updateCourseMutation.mutateAsync({
        courseId: id,
        data: {
          position_x: position.x,
          position_y: position.y,
        },
      });
    } catch (error) {
      console.error("Failed to persist position", error);
    }
  };

  const handleConnect = async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;

    const targetCourse = coursesById.get(connection.target);
    if (!targetCourse) return;

    const existing = targetCourse.prerequisites ?? [];
    const alreadyExists = existing.some((item) => item.course_id === connection.source);
    if (alreadyExists) return;

    const nextPrereqs: CoursePrerequisite[] = [...existing, { course_id: connection.source }];

    setEdges((eds) => addEdge(connection, eds));
    try {
      await updatePrerequisitesMutation.mutateAsync({
        courseId: targetCourse.id,
        prerequisites: nextPrereqs,
      });
    } catch (error) {
      console.error("Failed to add prerequisite", error);
      setEdges((eds) =>
        eds.filter((edge) => edge.id !== `${connection.source}->${connection.target}`)
      );
    }
  };

  const handleEdgesDelete = async (edgesToDelete: Edge[]) => {
    await Promise.all(
      edgesToDelete.map(async (edge) => {
        const targetCourse = coursesById.get(edge.target);
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
      })
    );
  };

  const selectedCourse = selectedCourseId ? (coursesById.get(selectedCourseId) ?? null) : null;

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-brand hover:underline"
          >
            ← Back to dashboard
          </button>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {detailQuery.data?.graph.title ?? "Graph editor"}
          </h1>
          <p className="mt-2 text-slate-600">
            Drag nodes to reposition courses, connect prerequisites, and update course details using
            the side panel.
          </p>
        </div>
      </section>

      <HealthStatusCard />

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
          {detailQuery.isLoading && <Skeleton className="absolute inset-0" />}
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={handleNodeDragStop}
              onConnect={handleConnect}
              onEdgesDelete={handleEdgesDelete}
              nodeTypes={nodeTypes}
              fitView
              className="rounded-xl"
            >
              <MiniMap pannable zoomable />
              <Controls />
              <Background gap={16} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <aside className="flex h-full flex-col gap-4">
          {selectedCourse ? (
            <CourseSidePanel course={selectedCourse} onClose={() => setSelectedCourseId(null)} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Select a course to edit its details. Double-click a node on the canvas.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

type CourseSidePanelProps = {
  course: CourseDetail;
  onClose: () => void;
};

function CourseSidePanel({ course, onClose }: CourseSidePanelProps) {
  const { graphId } = useParams<{ graphId: string }>();
  const updateCourseMutation = useUpdateCourseMutation(graphId ?? "");
  const [formState, setFormState] = useState(() => ({
    title: course.title,
    code: course.code,
    term: course.term ?? "",
    status: course.status,
    notes: course.notes ?? "",
  }));

  useEffect(() => {
    setFormState({
      title: course.title,
      code: course.code,
      term: course.term ?? "",
      status: course.status,
      notes: course.notes ?? "",
    });
  }, [course]);

  const handleChange =
    (field: keyof typeof formState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await updateCourseMutation.mutateAsync({
        courseId: course.id,
        data: {
          title: formState.title,
          code: formState.code,
          term: formState.term || null,
          status: formState.status as CourseStatus,
          notes: formState.notes || null,
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to update course", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{course.code}</h2>
          <p className="text-sm text-slate-500">Course details</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Close
        </button>
      </header>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Title
        <input
          value={formState.title}
          onChange={handleChange("title")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Code
        <input
          value={formState.code}
          onChange={handleChange("code")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Term
        <input
          value={formState.term}
          onChange={handleChange("term")}
          placeholder="e.g. Fall 2025"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Status
        <select
          value={formState.status}
          onChange={handleChange("status")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
        >
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Notes
        <textarea
          value={formState.notes}
          onChange={handleChange("notes")}
          rows={4}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
        />
      </label>

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
