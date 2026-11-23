import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/core/env";

/** Supabase client for Client Components (session stored in cookies). */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
