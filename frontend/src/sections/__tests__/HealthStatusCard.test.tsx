import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

import { HealthStatusCard } from "../HealthStatusCard";
import { useHealthQuery } from "../../features/health/useHealthQuery";

vi.mock("../../features/health/useHealthQuery", () => ({
  useHealthQuery: vi.fn(),
}));

const mockedUseHealthQuery = vi.mocked(useHealthQuery);

type HealthQueryResult = ReturnType<typeof useHealthQuery>;

const baseQueryState: Partial<HealthQueryResult> = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
};

const castResult = (overrides: Partial<HealthQueryResult>): HealthQueryResult => {
  return { ...baseQueryState, ...overrides } as HealthQueryResult;
};

function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("HealthStatusCard", () => {
  beforeEach(() => {
    mockedUseHealthQuery.mockReturnValue(castResult({}));
  });

  it("displays status when backend responds", () => {
    mockedUseHealthQuery.mockReturnValue(castResult({ data: { status: "ok" }, isLoading: false }));

    renderWithQuery(<HealthStatusCard />);

    expect(screen.getByText(/Backend responded with: ok/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", () => {
    mockedUseHealthQuery.mockReturnValue(
      castResult({ isLoading: false, isError: true, error: new Error("Network error") })
    );

    renderWithQuery(<HealthStatusCard />);

    expect(screen.getByText(/Unable to reach API/i)).toBeInTheDocument();
  });
});
