import { Skeleton } from "../../components/Skeleton";

import type { UseGraphsQueryResult } from "./types";

export type GraphListProps = {
  query: UseGraphsQueryResult;
  showSkeleton?: boolean;
};

export function GraphList({ query, showSkeleton = false }: GraphListProps) {
  if (query.isLoading || showSkeleton) {
    return (
      <section>
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Your graphs</h2>
        </header>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section>
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Your graphs</h2>
        </header>
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Unable to load graphs:{" "}
          {query.error instanceof Error ? query.error.message : "Unknown error"}
        </p>
      </section>
    );
  }

  const graphs = query.data ?? [];

  return (
    <section>
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Your graphs</h2>
        <span className="text-sm text-slate-500">{graphs.length} total</span>
      </header>
      {graphs.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {graphs.map((graph) => (
            <li
              key={graph.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <article className="flex h-full flex-col gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{graph.title}</h3>
                  {graph.description && (
                    <p className="mt-1 text-sm text-slate-600">{graph.description}</p>
                  )}
                </div>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Updated {new Date(graph.updated_at).toLocaleString()}
                </span>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <h3 className="text-lg font-semibold text-slate-900">No graphs yet</h3>
      <p className="mt-2 text-sm text-slate-600">
        Create a graph from scratch or start with a template. Your graphs will appear here once
        created.
      </p>
    </div>
  );
}
