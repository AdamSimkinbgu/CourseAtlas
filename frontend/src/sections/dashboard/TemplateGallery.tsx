import type { TemplateSummary } from "./useTemplatesQuery";
import type { UseTemplatesQueryResult } from "./types";
import { Skeleton } from "../../components/Skeleton";

export type TemplateGalleryProps = {
  query: UseTemplatesQueryResult;
};

export function TemplateGallery({ query }: TemplateGalleryProps) {
  if (query.isLoading) {
    return (
      <section>
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Templates</h2>
        </header>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section>
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Templates</h2>
        </header>
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Unable to load templates:{" "}
          {query.error instanceof Error ? query.error.message : "Unknown error"}
        </p>
      </section>
    );
  }

  const templates = query.data ?? [];

  return (
    <section>
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Templates</h2>
      </header>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.graph.id} template={template} />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({ template }: { template: TemplateSummary }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{template.graph.title}</h3>
        {template.summary && <p className="mt-1 text-sm text-slate-600">{template.summary}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {template.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
