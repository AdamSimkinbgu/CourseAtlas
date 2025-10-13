import { render, screen } from "@testing-library/react";

import { MultiSelectionInspector } from "../GraphEditorPage";
import type { CourseDetail } from "../../sections/graph-editor/useGraphDetailQuery";

function makeCourse(overrides: Partial<CourseDetail>): CourseDetail {
  return {
    id: "course-id",
    graph_id: "graph-1",
    code: "COURSE",
    title: "Generic Course",
    credits: 3,
    term: null,
    status: "planned",
    grade: null,
    is_pass_fail: false,
    position_x: 0,
    position_y: 0,
    notes: null,
    prerequisites: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("MultiSelectionInspector", () => {
  it("orders containers before ungrouped courses and highlights selected containers", () => {
    const { container } = render(
      <MultiSelectionInspector
        groups={[
          {
            id: "a",
            title: "Alpha Container",
            isSelected: true,
            totalCourses: 1,
            courses: [makeCourse({ id: "course-1", code: "CS101", title: "Intro to CS" })],
          },
          {
            id: "b",
            title: "Beta Container",
            isSelected: false,
            totalCourses: 1,
            courses: [makeCourse({ id: "course-2", code: "CS102", title: "Data Structures" })],
          },
        ]}
        ungroupedCourses={[makeCourse({ id: "course-3", code: "CS103", title: "Independent Study" })]}
        totals={{ containerCount: 2, courseCount: 3 }}
      />
    );

    expect(
      screen.getByText("2 containers · 3 courses")
    ).toBeInTheDocument();

    const sections = Array.from(container.querySelectorAll("section"));
    expect(sections).toHaveLength(3);
    expect(sections[0]).toHaveTextContent("Alpha Container");
    expect(sections[0]).toHaveTextContent("Selected container");
    expect(sections[0]).toHaveTextContent("1 course");
    expect(sections[0]).toHaveTextContent("CS101");
    expect(sections[1]).toHaveTextContent("Beta Container");
    expect(sections[1]).toHaveTextContent("Container not selected");
    expect(sections[1]).toHaveTextContent("CS102");
    expect(sections[2]).toHaveTextContent("Ungrouped courses");
    expect(sections[2]).toHaveTextContent("CS103");
  });
});
