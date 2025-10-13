import { describe, expect, it } from "vitest";

type Snapshot = {
  nodes: Array<{ id: string; selected?: boolean }>;
  edges: Array<{ id: string }>;
  assignments: Record<string, string>;
};

const cloneNodes = (nodes: Snapshot["nodes"]) => nodes.map((node) => ({ ...node }));
const cloneEdges = (edges: Snapshot["edges"]) => edges.map((edge) => ({ ...edge }));

function createHistoryStack(base: Snapshot) {
  const history: Snapshot[] = [];
  const future: Snapshot[] = [];
  const nodesRef = { current: cloneNodes(base.nodes) };
  const edgesRef = { current: cloneEdges(base.edges) };
  const assignmentsRef = { current: { ...base.assignments } };

  const pushHistory = (snapshot: Snapshot) => {
    history.push({
      nodes: cloneNodes(snapshot.nodes),
      edges: cloneEdges(snapshot.edges),
      assignments: { ...snapshot.assignments },
    });
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    future.length = 0;
  };

  const undo = () => {
    if (history.length === 0) return null;
    const previous = history[history.length - 1];
    future.unshift({
      nodes: cloneNodes(nodesRef.current),
      edges: cloneEdges(edgesRef.current),
      assignments: { ...assignmentsRef.current },
    });
    history.pop();
    nodesRef.current = cloneNodes(previous.nodes);
    edgesRef.current = cloneEdges(previous.edges);
    assignmentsRef.current = { ...previous.assignments };
    return previous;
  };

  const redo = () => {
    if (future.length === 0) return null;
    const next = future.shift()!;
    history.push({
      nodes: cloneNodes(nodesRef.current),
      edges: cloneEdges(edgesRef.current),
      assignments: { ...assignmentsRef.current },
    });
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    nodesRef.current = cloneNodes(next.nodes);
    edgesRef.current = cloneEdges(next.edges);
    assignmentsRef.current = { ...next.assignments };
    return next;
  };

  return {
    pushHistory,
    undo,
    redo,
    history,
    future,
    nodesRef,
    edgesRef,
    assignmentsRef,
  };
}

describe("Graph history undo/redo", () => {
  it("restores structural snapshots and leaves transient selection untouched", () => {
    const base: Snapshot = {
      nodes: [{ id: "course-1" }, { id: "course-2" }],
      edges: [],
      assignments: { "course-1": "container-a" },
    };

    const stack = createHistoryStack(base);

    const afterAdd: Snapshot = {
      nodes: [{ id: "course-1" }, { id: "course-2" }, { id: "course-3" }],
      edges: [{ id: "edge-1" }],
      assignments: { "course-1": "container-a", "course-3": "container-b" },
    };

    const selectionSnapshot: Snapshot = {
      nodes: [{ id: "course-1", selected: true }, { id: "course-2", selected: true }],
      edges: [],
      assignments: { "course-1": "container-a" },
    };

    const afterDelete: Snapshot = {
      nodes: [{ id: "course-1" }],
      edges: [],
      assignments: {},
    };

    stack.pushHistory(afterAdd);
    stack.pushHistory(selectionSnapshot);
    stack.pushHistory(afterDelete);

    expect(stack.history).toHaveLength(3);

    const undo1 = stack.undo();
    expect(undo1?.nodes).toEqual(afterDelete.nodes);

    const undo2 = stack.undo();
    expect(undo2?.nodes).toEqual(selectionSnapshot.nodes);

    const undo3 = stack.undo();
    expect(undo3?.nodes).toEqual(afterAdd.nodes);

    expect(stack.undo()).toBeNull();

    const redo1 = stack.redo();
    expect(redo1?.nodes).toEqual(selectionSnapshot.nodes);

    const redo2 = stack.redo();
    expect(redo2?.nodes).toEqual(afterDelete.nodes);
  });
});
