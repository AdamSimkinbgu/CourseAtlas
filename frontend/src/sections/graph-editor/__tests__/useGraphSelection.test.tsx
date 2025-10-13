import { renderHook, act } from "@testing-library/react";
import type { PropsWithChildren } from "react";

import {
  GraphSelectionProvider,
  useGraphSelection,
} from "../useGraphSelection";

function wrapper({ children }: PropsWithChildren) {
  return <GraphSelectionProvider>{children}</GraphSelectionProvider>;
}

describe("useGraphSelection", () => {
  it("selects a course and toggles detail on consecutive clicks", () => {
    const { result } = renderHook(() => useGraphSelection(), { wrapper });

    act(() => {
      result.current.select({ courses: ["course-1"], containers: [], edges: [] });
    });
    expect(result.current.courses).toEqual(["course-1"]);
    expect(result.current.isDetailOpen).toBe(false);

    act(() => {
      result.current.rememberClick("course", "course-1");
    });
    expect(result.current.isDetailOpen).toBe(false);

    act(() => {
      result.current.toggleDetail("course", "course-1");
    });
    expect(result.current.isDetailOpen).toBe(true);
    expect(result.current.detailTarget).toEqual({ type: "course", id: "course-1" });

    act(() => {
      result.current.toggleDetail("course", "course-1");
    });
    expect(result.current.isDetailOpen).toBe(false);
  });

  it("clears detail target when a new selection arrives", () => {
    const { result } = renderHook(() => useGraphSelection(), { wrapper });

    act(() => {
      result.current.select({ courses: ["course-1"], containers: [], edges: [] });
      result.current.rememberClick("course", "course-1");
      result.current.toggleDetail("course", "course-1");
    });
    expect(result.current.isDetailOpen).toBe(true);

    act(() => {
      result.current.select({ courses: ["course-2"], containers: [], edges: [] });
    });
    expect(result.current.courses).toEqual(["course-2"]);
    expect(result.current.isDetailOpen).toBe(false);
    expect(result.current.detailTarget).toBeNull();
    expect(result.current.lastClicked).toBeNull();
  });

  it("enters and exits aggregate detail mode", () => {
    const { result } = renderHook(() => useGraphSelection(), { wrapper });

    act(() => {
      result.current.select({
        courses: ["course-1", "course-2"],
        containers: ["container-1"],
        edges: [],
      });
    });
    expect(result.current.courses).toEqual(["course-1", "course-2"]);
    expect(result.current.containers).toEqual(["container-1"]);
    expect(result.current.isDetailOpen).toBe(false);

    act(() => {
      result.current.openAggregateDetail();
    });
    expect(result.current.isDetailOpen).toBe(true);
    expect(result.current.detailTarget).toBeNull();

    act(() => {
      result.current.closeDetail();
      result.current.clear();
    });
    expect(result.current.courses).toEqual([]);
    expect(result.current.containers).toEqual([]);
    expect(result.current.isDetailOpen).toBe(false);
  });
});
