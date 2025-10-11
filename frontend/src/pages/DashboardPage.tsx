import { HealthStatusCard } from "../sections/HealthStatusCard";

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-3xl font-semibold text-slate-900">Welcome to Course Atlas</h1>
        <p className="mt-2 text-slate-600">
          Start by confirming the backend is reachable. Once you see a healthy status below, you can
          continue building the frontend experience.
        </p>
      </section>

      <HealthStatusCard />
    </div>
  );
}
