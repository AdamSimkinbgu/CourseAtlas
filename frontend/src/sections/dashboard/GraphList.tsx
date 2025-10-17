import { ReactNode } from "react";

import type { GraphSummary } from "./useGraphsQuery";
import { Skeleton } from "../../components/Skeleton";

export type GraphListProps = {
  graphs: GraphSummary[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  showSkeleton?: boolean;
  searchTerm: string;
  pendingDuplicateId?: string;
  pendingDeleteId?: string;
  onOpenGraph: (id: string) => void;
  onDuplicateGraph: (id: string) => void;
  onDeleteGraph: (id: string) => void;
};

export function GraphList({
  graphs,
  isLoading,
  isError,
  error,
  showSkeleton = false,
  searchTerm,
  pendingDuplicateId,
  pendingDeleteId,
  onOpenGraph,
  onDuplicateGraph,
  onDeleteGraph,
}: GraphListProps) {
  if (isLoading || showSkeleton) {
    return (
      <section>
        <Header total={graphs.length} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </section>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section>
        <Header total={graphs.length} />
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
          Unable to load graphs: {message}
        </p>
      </section>
    );
  }

  const trimmedSearch = searchTerm.trim().toLowerCase();
  const filtered = trimmedSearch
    ? graphs.filter((graph) => graph.title.toLowerCase().includes(trimmedSearch))
    : graphs;

  return (
    <section>
      <Header total={graphs.length} />
      {filtered.length === 0 ? (
        <EmptyStates total={graphs.length} searchTerm={trimmedSearch} />
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {filtered.map((graph) => {
            const duplicatePending = pendingDuplicateId === graph.id;
            const deletePending = pendingDeleteId === graph.id;

            return (
              <li
                key={graph.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/50 dark:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.7)]"
              >
                <article className="flex h-full flex-col gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {graph.title}
                    </h3>
                    {graph.description && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {graph.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Updated {new Date(graph.updated_at).toLocaleString()}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <ActionButton onClick={() => onOpenGraph(graph.id)}>Open</ActionButton>
                    <ActionButton
                      onClick={() => onDuplicateGraph(graph.id)}
                      disabled={duplicatePending}
                    >
                      {duplicatePending ? "Duplicating…" : "Duplicate"}
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => onDeleteGraph(graph.id)}
                      disabled={deletePending}
                    >
                      {deletePending ? "Deleting…" : "Delete"}
                    </ActionButton>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Header({ total }: { total: number }) {
  return (
    <header className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your graphs</h2>
      <span className="text-sm text-slate-500 dark:text-slate-400">{total} total</span>
    </header>
  );
}

function EmptyStates({ total, searchTerm }: { total: number; searchTerm: string }) {
  if (total === 0) {
    return <PrimaryEmptyState />;
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center transition-colors dark:border-slate-700 dark:bg-slate-900/40">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No matches found</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        We couldn&apos;t find any graphs matching{" "}
        <span className="font-medium">"{searchTerm}"</span>. Try adjusting your search.
      </p>
    </div>
  );
}

function PrimaryEmptyState() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center transition-colors dark:border-slate-700 dark:bg-slate-900/40">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No graphs yet</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Create a graph from scratch or start with a template. Your graphs will appear here once
        created.
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  const base =
    "rounded-md border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "danger"
      ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
      : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60";

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
