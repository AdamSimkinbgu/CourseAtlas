import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddCourseDialog } from "../GraphEditorPage";

describe("AddCourseDialog", () => {
  const renderDialog = (override: Partial<ComponentProps<typeof AddCourseDialog>> = {}) => {
    const props = {
      open: true,
      onClose: vi.fn(),
      onSubmit: vi.fn(),
      isSubmitting: false,
      ...override,
    };
    const result = render(<AddCourseDialog {...props} />);
    return { props, ...result };
  };

  it("submits form data", () => {
    const { props } = renderDialog();

    fireEvent.change(screen.getByLabelText(/Code/i), { target: { value: "CS101" } });
    fireEvent.change(screen.getByLabelText(/^Title/i), {
      target: { value: "Intro to CS" },
    });
    fireEvent.change(screen.getByLabelText(/^Credits/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/Term/i), {
      target: { value: "Fall 2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Status/i), {
      target: { value: "completed" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Add course" }));

    expect(props.onSubmit).toHaveBeenCalledWith({
      code: "CS101",
      title: "Intro to CS",
      credits: "4",
      term: "Fall 2025",
      status: "completed",
      notes: "",
      is_pass_fail: false,
    });
  });

  it("resets the form when reopened", () => {
    const { props, rerender } = renderDialog();

    const checkbox = screen.getByRole("checkbox", { name: /Pass\/fail/i });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.change(screen.getByLabelText(/Code/i), { target: { value: "TEMP" } });
    fireEvent.click(screen.getByText(/Close/i));

    rerender(<AddCourseDialog {...props} open={false} />);
    rerender(<AddCourseDialog {...props} open />);

    expect((screen.getByLabelText(/Code/i) as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("checkbox", { name: /Pass\/fail/i })).not.toBeChecked();
  });
});
