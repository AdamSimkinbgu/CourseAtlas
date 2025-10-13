import { useHealthQuery } from "../features/health/useHealthQuery";

export function HealthStatusCard() {
  const { data, isLoading, isError, error } = useHealthQuery();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/50 dark:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.7)]">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Backend Health</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        The frontend pings the FastAPI `/healthz` endpoint using React Query.
      </p>

      <div className="mt-4">
        {isLoading && (
          <p data-testid="api-status" className="text-slate-500 dark:text-slate-400">
            Checking backend health...
          </p>
        )}
        {isError && (
          <p
            data-testid="api-status"
            className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
          >
            Unable to reach API ({error instanceof Error ? error.message : "unknown error"})
          </p>
        )}
        {data && (
          <p
            data-testid="api-status"
            className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
          >
            Backend responded with: {data.status}
          </p>
        )}
      </div>
    </section>
  );
}
