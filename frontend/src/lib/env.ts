function requireEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const supabaseProjectUrl = requireEnv(
  import.meta.env.VITE_SUPABASE_PROJECT_URL,
  "VITE_SUPABASE_PROJECT_URL"
);

const supabaseAnonKey = requireEnv(
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  "VITE_SUPABASE_ANON_KEY"
);

export const env = {
  apiBaseUrl,
  supabaseProjectUrl,
  supabaseAnonKey,
};
