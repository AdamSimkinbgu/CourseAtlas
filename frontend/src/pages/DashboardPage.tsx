import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HealthStatusCard } from "../sections/HealthStatusCard";
import { useGraphsQuery } from "../sections/dashboard/useGraphsQuery";
import { useTemplatesQuery } from "../sections/dashboard/useTemplatesQuery";
import { GraphList } from "../sections/dashboard/GraphList";
import { TemplateGallery } from "../sections/dashboard/TemplateGallery";
import { useCreateGraphMutation } from "../sections/dashboard/useCreateGraphMutation";
import { PlusIcon } from "../components/icons/PlusIcon";

export function DashboardPage() {
  const navigate = useNavigate();
  const graphsQuery = useGraphsQuery();
  const templatesQuery = useTemplatesQuery();
  const createGraphMutation = useCreateGraphMutation();
  const [showSkeleton, setShowSkeleton] = useState(false);

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

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Your dashboard</h1>
          <p className="mt-2 text-slate-600">
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

      <HealthStatusCard />

      <GraphList query={graphsQuery} showSkeleton={showSkeleton} />

      <TemplateGallery query={templatesQuery} />
    </div>
  );
}
