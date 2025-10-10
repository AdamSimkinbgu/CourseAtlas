import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type HealthResponse = {
  status: string;
};

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${API_BASE_URL}/healthz`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }
        return (await response.json()) as HealthResponse;
      })
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to reach API");
      });
  }, []);

  return (
    <main>
      <h1>Course Atlas</h1>
      <section>
        <h2>API Health</h2>
        {health ? (
          <p data-testid="api-status">Backend responded with: {health.status}</p>
        ) : (
          <p data-testid="api-status">
            {error ? `Unable to reach API (${error})` : "Checking backend health..."}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
