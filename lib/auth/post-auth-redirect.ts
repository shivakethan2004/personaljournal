import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sends a freshly authenticated user to /onboarding if they haven't
 * completed it yet, otherwise to /dashboard.
 */
export async function getPostAuthRedirect(
  supabase: SupabaseClient,
  userId: string
): Promise<"/onboarding" | "/dashboard"> {
  const { data } = await supabase
    .from("onboarding_responses")
    .select("id")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .maybeSingle();

  return data ? "/dashboard" : "/onboarding";
}