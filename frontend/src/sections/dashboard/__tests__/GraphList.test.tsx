import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GraphList } from "../GraphList";
import type { GraphSummary } from "../useGraphsQuery";

const baseGraph: GraphSummary = {
  id: "graph-1",
  title: "My Plan",
  description: "First semester",
  updated_at: new Date("2025-01-01T00:00:00Z").toISOString(),
};

describe("GraphList", () => {
  const noop = vi.fn();

  it("renders graphs", () => {
    render(
      <GraphList
        graphs={[baseGraph]}
        isLoading={false}
        isError={false}
        error={null}
        searchTerm=""
        onOpenGraph={noop}
        onDuplicateGraph={noop}
        onDeleteGraph={noop}
      />
    );

    expect(screen.getByText("My Plan")).toBeInTheDocument();
  });

  it("shows empty filtered state when no matches", () => {
    render(
      <GraphList
        graphs={[baseGraph]}
        isLoading={false}
        isError={false}
        error={null}
        searchTerm="biology"
        onOpenGraph={noop}
        onDuplicateGraph={noop}
        onDeleteGraph={noop}
      />
    );

    expect(screen.getByText(/No matches found/)).toBeInTheDocument();
  });
});
