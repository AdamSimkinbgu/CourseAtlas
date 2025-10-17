import { Skeleton } from "../../components/Skeleton";
import type { TemplateSummary } from "./useTemplatesQuery";

export type TemplateGalleryProps = {
  templates: TemplateSummary[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  pendingTemplateId?: string;
  onUseTemplate: (templateId: string) => void;
};

export function TemplateGallery({
  templates,
  isLoading,
  isError,
  error,
  pendingTemplateId,
  onUseTemplate,
}: TemplateGalleryProps) {
  if (isLoading) {
    return (
      <section>
        <Header />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </section>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section>
        <Header />
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
          Unable to load templates: {message}
        </p>
      </section>
    );
  }

  if (templates.length === 0) {
    return (
      <section>
        <Header />
        <EmptyTemplates />
      </section>
    );
  }

  return (
    <section>
      <Header />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {templates.map((template) => {
          const isPending = pendingTemplateId === template.graph.id;

          return (
            <article
              key={template.graph.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/50 dark:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.7)]"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {template.graph.title}
                </h3>
                {template.summary && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {template.summary}
                  </p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onUseTemplate(template.graph.id)}
                disabled={isPending}
                className="mt-4 w-full rounded-md border border-brand bg-white px-3 py-2 text-sm font-medium text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand/60 dark:bg-slate-900/40 dark:hover:bg-slate-800/70"
              >
                {isPending ? "Cloning…" : "Use template"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Templates</h2>
    </header>
  );
}

function EmptyTemplates() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center transition-colors dark:border-slate-700 dark:bg-slate-900/40">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        No templates available
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Templates you publish will appear here. Start by building a graph and sharing it as a
        template.
      </p>
    </div>
  );
}
