import { vi } from "vitest";

import "@testing-library/jest-dom";

vi.stubEnv("VITE_SUPABASE_PROJECT_URL", "https://example.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8000");
