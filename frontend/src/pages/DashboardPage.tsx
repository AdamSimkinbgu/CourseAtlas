import { ChangeEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { HealthStatusCard } from "../sections/HealthStatusCard";
import { useGraphsQuery, type GraphSummary } from "../sections/dashboard/useGraphsQuery";
import { useTemplatesQuery } from "../sections/dashboard/useTemplatesQuery";
import { GraphList } from "../sections/dashboard/GraphList";
import { TemplateGallery } from "../sections/dashboard/TemplateGallery";
import { useCreateGraphMutation } from "../sections/dashboard/useCreateGraphMutation";
import { useDuplicateGraphMutation } from "../sections/dashboard/useDuplicateGraphMutation";
import { useDeleteGraphMutation } from "../sections/dashboard/useDeleteGraphMutation";
import { useUseTemplateMutation } from "../sections/dashboard/useUseTemplateMutation";
import { PlusIcon } from "../components/icons/PlusIcon";

export function DashboardPage() {
  const navigate = useNavigate();
  const graphsQuery = useGraphsQuery();
  const templatesQuery = useTemplatesQuery();
  const createGraphMutation = useCreateGraphMutation();
  const duplicateGraphMutation = useDuplicateGraphMutation();
  const deleteGraphMutation = useDeleteGraphMutation();
  const useTemplateMutation = useUseTemplateMutation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [pendingDuplicateId, setPendingDuplicateId] = useState<string | undefined>();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | undefined>();
  const [pendingTemplateId, setPendingTemplateId] = useState<string | undefined>();

  const searchTerm = searchParams.get("q") ?? "";

  const handleCreateGraph = async () => {
    try {
      setShowSkeleton(true);
      const graph = await createGraphMutation.mutateAsync({
        title: "Untitled graph",
        description: "",
      });
      navigate(`/graphs/${graph.id}`);
    } catch (error) {
      console.error("Failed to create graph", error);
    } finally {
      setShowSkeleton(false);
    }
  };

  const handleOpenGraph = (graphId: string) => {
    navigate(`/graphs/${graphId}`);
  };

  const handleDuplicateGraph = async (graphId: string) => {
    try {
      setPendingDuplicateId(graphId);
      const graph = await duplicateGraphMutation.mutateAsync(graphId);
      navigate(`/graphs/${graph.id}`);
    } catch (error) {
      console.error("Failed to duplicate graph", error);
    } finally {
      setPendingDuplicateId(undefined);
    }
  };

  const handleDeleteGraph = async (graphId: string) => {
    const graph = graphsQuery.data?.find((item) => item.id === graphId);
    const confirmed = window.confirm(
      `Delete "${graph?.title ?? "this graph"}"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    try {
      setPendingDeleteId(graphId);
      await deleteGraphMutation.mutateAsync(graphId);
    } catch (error) {
      console.error("Failed to delete graph", error);
    } finally {
      setPendingDeleteId(undefined);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      setPendingTemplateId(templateId);
      const graph = await useTemplateMutation.mutateAsync(templateId);
      navigate(`/graphs/${graph.id}`);
    } catch (error) {
      console.error("Failed to clone template", error);
    } finally {
      setPendingTemplateId(undefined);
    }
  };

  const sortedGraphs = useMemo<GraphSummary[]>(() => {
    if (!graphsQuery.data) return [];
    return [...graphsQuery.data].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [graphsQuery.data]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-900 transition-colors dark:text-slate-100">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Your dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Review your course plans, build a new graph, or start from a featured template.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateGraph}
          disabled={createGraphMutation.isPending}
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          {createGraphMutation.isPending ? "Creating..." : "New graph"}
        </button>
      </section>

      <section className="flex items-center gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:shadow-none">
          <span className="sr-only">Search graphs</span>
          <input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search your graphs"
            className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>
      </section>

      <HealthStatusCard />

      <GraphList
        graphs={sortedGraphs}
        isLoading={graphsQuery.isLoading}
        isError={graphsQuery.isError}
        error={graphsQuery.error}
        showSkeleton={showSkeleton}
        searchTerm={searchTerm}
        pendingDuplicateId={pendingDuplicateId}
        pendingDeleteId={pendingDeleteId}
        onOpenGraph={handleOpenGraph}
        onDuplicateGraph={handleDuplicateGraph}
        onDeleteGraph={handleDeleteGraph}
      />

      <TemplateGallery
        templates={templatesQuery.data ?? []}
        isLoading={templatesQuery.isLoading}
        isError={templatesQuery.isError}
        error={templatesQuery.error}
        pendingTemplateId={pendingTemplateId}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
