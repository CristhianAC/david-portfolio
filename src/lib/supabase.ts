import { createClient } from "@supabase/supabase-js";

// Use PUBLIC_ prefixed env vars for client-side bundles (Astro exposes import.meta.env.PUBLIC_*)
// Fallback to server-only env vars when PUBLIC_ vars are not set.
const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "supabaseUrl and supabaseKey are required. Set SUPABASE_URL / SUPABASE_KEY or PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY in your environment."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
