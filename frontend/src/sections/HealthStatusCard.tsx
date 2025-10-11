import { useHealthQuery } from "../features/health/useHealthQuery";

export function HealthStatusCard() {
  const { data, isLoading, isError, error } = useHealthQuery();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Backend Health</h2>
      <p className="mt-1 text-sm text-slate-600">
        The frontend pings the FastAPI `/healthz` endpoint using React Query.
      </p>

      <div className="mt-4">
        {isLoading && (
          <p data-testid="api-status" className="text-slate-500">
            Checking backend health...
          </p>
        )}
        {isError && (
          <p
            data-testid="api-status"
            className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            Unable to reach API ({error instanceof Error ? error.message : "unknown error"})
          </p>
        )}
        {data && (
          <p
            data-testid="api-status"
            className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          >
            Backend responded with: {data.status}
          </p>
        )}
      </div>
    </section>
  );
}
