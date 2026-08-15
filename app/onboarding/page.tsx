import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { LibraryMetric, ProblemPattern } from "@/types/domain";

export default async function OnboardingPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If onboarding is already complete, skip straight to the dashboard.
  const { data: existing } = await supabase
    .from("onboarding_responses")
    .select("id")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .maybeSingle();

  if (existing) {
    redirect("/dashboard");
  }

  const [{ data: patterns, error: patternsError }, { data: metrics, error: metricsError }] =
    await Promise.all([
      supabase.from("problem_patterns").select("id, name, description"),
      supabase
        .from("metrics_library")
        .select("id, name, description, why_it_helps, input_type, problem_pattern_id"),
    ]);

  if (patternsError || metricsError) {
    throw new Error(
      patternsError?.message ?? metricsError?.message ?? "Failed to load onboarding data"
    );
  }

  return (
    <main className="min-h-screen">
      <OnboardingWizard
        patterns={(patterns ?? []) as ProblemPattern[]}
        metrics={(metrics ?? []) as LibraryMetric[]}
      />
    </main>
  );
}