import { createContext, useContext, useMemo, useReducer } from "react";

type SelectionKind = "course" | "container";

type SelectionState = {
  courses: string[];
  containers: string[];
  edges: string[];
  detailTarget: { type: SelectionKind; id: string } | null;
  isDetailOpen: boolean;
  lastClicked: { type: SelectionKind; id: string } | null;
};

type SelectPayload = {
  courses: string[];
  containers: string[];
  edges: string[];
};

type Action =
  | { type: "select"; payload: SelectPayload }
  | { type: "toggle-detail"; payload: { type: SelectionKind; id: string } }
  | { type: "open-detail"; payload: { type: SelectionKind; id: string } }
  | { type: "open-aggregate" }
  | { type: "close-detail" }
  | { type: "remember-click"; payload: { type: SelectionKind; id: string } }
  | { type: "clear" };

const initialState: SelectionState = {
  courses: [],
  containers: [],
  edges: [],
  detailTarget: null,
  isDetailOpen: false,
  lastClicked: null,
};

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

function targetsEqual(
  a: { type: SelectionKind; id: string } | null,
  b: { type: SelectionKind; id: string } | null
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.type === b.type && a.id === b.id;
}

function reducer(state: SelectionState, action: Action): SelectionState {
  switch (action.type) {
    case "select": {
      const dedupedCourses = dedupe(action.payload.courses);
      const dedupedContainers = dedupe(action.payload.containers);
      const dedupedEdges = dedupe(action.payload.edges);
      const nextCourses = arraysEqual(state.courses, dedupedCourses)
        ? state.courses
        : dedupedCourses;
      const nextContainers = arraysEqual(state.containers, dedupedContainers)
        ? state.containers
        : dedupedContainers;
      const nextEdges = arraysEqual(state.edges, dedupedEdges) ? state.edges : dedupedEdges;
      const nothingSelected =
        nextCourses.length === 0 && nextContainers.length === 0 && nextEdges.length === 0;

      if (nothingSelected) {
        return {
          ...initialState,
        };
      }

      const currentTarget = state.detailTarget;
      const stillContainsTarget = currentTarget
        ? (currentTarget.type === "course" && nextCourses.includes(currentTarget.id)) ||
          (currentTarget.type === "container" && nextContainers.includes(currentTarget.id))
        : false;

      const singleCourse = nextCourses.length === 1 && nextContainers.length === 0;
      const singleContainer = nextContainers.length === 1 && nextCourses.length === 0;
      const selectionContainsLastClicked =
        state.lastClicked &&
        ((state.lastClicked.type === "course" && nextCourses.includes(state.lastClicked.id)) ||
          (state.lastClicked.type === "container" && nextContainers.includes(state.lastClicked.id)));
      const nextDetailTarget = stillContainsTarget ? currentTarget : null;
      const nextIsDetailOpen = stillContainsTarget ? state.isDetailOpen : false;
      const selectionChanged =
        nextCourses !== state.courses ||
        nextContainers !== state.containers ||
        nextEdges !== state.edges;

      let nextLastClicked: SelectionState["lastClicked"] = selectionChanged
        ? null
        : state.lastClicked;
      if (!selectionChanged) {
        if (!selectionContainsLastClicked) {
          nextLastClicked = null;
        }
      } else {
        // selection changed; ensure last clicked is reset so subsequent click starts fresh
        nextLastClicked = null;
      }

      const nothingChanged =
        nextCourses === state.courses &&
        nextContainers === state.containers &&
        nextEdges === state.edges &&
        targetsEqual(nextDetailTarget, state.detailTarget) &&
        nextIsDetailOpen === state.isDetailOpen &&
        targetsEqual(nextLastClicked, state.lastClicked);

      if (nothingChanged) {
        return state;
      }

      return {
        courses: nextCourses,
        containers: nextContainers,
        edges: nextEdges,
        detailTarget: nextDetailTarget,
        isDetailOpen: nextIsDetailOpen,
        lastClicked: nextLastClicked,
      };
    }
    case "toggle-detail": {
      const { type, id } = action.payload;
      const sameTarget = state.detailTarget && state.detailTarget.type === type && state.detailTarget.id === id;
      return {
        ...state,
        detailTarget: { type, id },
        isDetailOpen: sameTarget ? !state.isDetailOpen : true,
        lastClicked: { type, id },
      };
    }
    case "open-detail": {
      const { type, id } = action.payload;
      return {
        ...state,
        detailTarget: { type, id },
        isDetailOpen: true,
        lastClicked: { type, id },
      };
    }
    case "open-aggregate": {
      return {
        ...state,
        detailTarget: null,
        isDetailOpen: true,
      };
    }
    case "close-detail": {
      return {
        ...state,
        isDetailOpen: false,
      };
    }
    case "remember-click": {
      const { type, id } = action.payload;
      return {
        ...state,
        lastClicked: { type, id },
      };
    }
    case "clear":
      return { ...initialState };
    default:
      return state;
  }
}

type SelectionContextValue = {
  courses: string[];
  containers: string[];
  edges: string[];
  isDetailOpen: boolean;
  detailTarget: SelectionState["detailTarget"];
  lastClicked: SelectionState["lastClicked"];
  totals: {
    courseCount: number;
    containerCount: number;
  };
  select: (payload: SelectPayload) => void;
  toggleDetail: (type: SelectionKind, id: string) => void;
  openDetail: (type: SelectionKind, id: string) => void;
  openAggregateDetail: () => void;
  closeDetail: () => void;
  rememberClick: (type: SelectionKind, id: string) => void;
  clear: () => void;
};

const GraphSelectionContext = createContext<SelectionContextValue | undefined>(undefined);

export function GraphSelectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<SelectionContextValue>(
    () => ({
      courses: state.courses,
      containers: state.containers,
      edges: state.edges,
      isDetailOpen: state.isDetailOpen,
      detailTarget: state.detailTarget,
      lastClicked: state.lastClicked,
      totals: {
        courseCount: state.courses.length,
        containerCount: state.containers.length,
      },
      select: (payload) => dispatch({ type: "select", payload }),
      toggleDetail: (type, id) => dispatch({ type: "toggle-detail", payload: { type, id } }),
      openDetail: (type, id) => dispatch({ type: "open-detail", payload: { type, id } }),
      openAggregateDetail: () => dispatch({ type: "open-aggregate" }),
      closeDetail: () => dispatch({ type: "close-detail" }),
      rememberClick: (type, id) => dispatch({ type: "remember-click", payload: { type, id } }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state]
  );

  return <GraphSelectionContext.Provider value={value}>{children}</GraphSelectionContext.Provider>;
}

export function useGraphSelection() {
  const context = useContext(GraphSelectionContext);
  if (!context) {
    throw new Error("useGraphSelection must be used within a GraphSelectionProvider");
  }
  return context;
}
