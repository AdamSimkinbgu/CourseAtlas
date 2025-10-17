import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "../lib/env";

export type CourseAtlasSupabaseClient = SupabaseClient;

export const supabase: CourseAtlasSupabaseClient = createClient(
  env.supabaseProjectUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
