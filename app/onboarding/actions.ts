"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityDraft, CustomMetricDraft } from "@/types/domain";

export type CompleteOnboardingInput = {
  quizAnswers: Record<string, number>;
  matchedPatternIds: string[];
  selectedLibraryMetricIds: string[];
  customMetrics: CustomMetricDraft[];
  activities: ActivityDraft[];
};

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function completeOnboarding(
  input: CompleteOnboardingInput
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  if (input.activities.length === 0) {
    return { ok: false, error: "At least one activity is required." };
  }

  // 1. Insert any custom metrics the user defined, and collect their ids.
  let customMetricIds: string[] = [];
  if (input.customMetrics.length > 0) {
    const { data: inserted, error: customMetricsError } = await supabase
      .from("custom_metrics")
      .insert(
        input.customMetrics.map((m) => ({
          user_id: user.id,
          name: m.name,
          description: m.description || null,
          input_type: m.input_type,
        }))
      )
      .select("id");

    if (customMetricsError) {
      return { ok: false, error: customMetricsError.message };
    }
    customMetricIds = (inserted ?? []).map((r) => r.id as string);
  }

  // 2. Insert user_metrics rows: one per selected library metric, one per
  // newly created custom metric.
  const userMetricRows = [
    ...input.selectedLibraryMetricIds.map((metricId) => ({
      user_id: user.id,
      metric_id: metricId,
      custom_metric_id: null,
      active: true,
    })),
    ...customMetricIds.map((customMetricId) => ({
      user_id: user.id,
      metric_id: null,
      custom_metric_id: customMetricId,
      active: true,
    })),
  ];

  if (userMetricRows.length > 0) {
    const { error: userMetricsError } = await supabase
      .from("user_metrics")
      .insert(userMetricRows);

    if (userMetricsError) {
      return { ok: false, error: userMetricsError.message };
    }
  }

  // 3. Insert the user's defined activities.
  const { error: activitiesError } = await supabase.from("activities").insert(
    input.activities.map((a) => ({
      user_id: user.id,
      name: a.name,
      description: a.description || null,
      active: true,
    }))
  );

  if (activitiesError) {
    return { ok: false, error: activitiesError.message };
  }

  // 4. Save the quiz + matched patterns.
  const { error: onboardingError } = await supabase
    .from("onboarding_responses")
    .insert({
      user_id: user.id,
      quiz_answers: input.quizAnswers,
      matched_pattern_ids: input.matchedPatternIds,
      completed_at: new Date().toISOString(),
    });

  if (onboardingError) {
    return { ok: false, error: onboardingError.message };
  }

  return { ok: true };
}