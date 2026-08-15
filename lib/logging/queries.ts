import "server-only";
import { createClient } from "@/lib/supabase/server";
import { metricKey } from "./metric-key";
import { BASELINE_WINDOW } from "./recovery";
import type {
  Activity,
  ActiveUserMetric,
  DailyPlan,
  EveningReflection,
  QuickLog,
} from "@/types/logging";

/**
 * NOTE ON ASSUMPTIONS: these helpers assume `createClient()` in
 * lib/supabase/server.ts returns an async Supabase server client bound to
 * the request's cookies (the standard @supabase/ssr pattern), the same
 * one used by your onboarding/settings server actions. Adjust the import
 * if your actual signature differs.
 */

export async function getActiveActivities(userId: string): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Active metrics a user tracks, resolved against metrics_library /
 * custom_metrics so callers get name/description/input_type directly.
 */
export async function getActiveUserMetrics(userId: string): Promise<ActiveUserMetric[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_metrics")
    .select(
      `id, metric_id, custom_metric_id, active,
       metrics_library ( name, description, input_type ),
       custom_metrics ( name, description, input_type )`
    )
    .eq("user_id", userId)
    .eq("active", true);
  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const isCustom = !!row.custom_metric_id;
    const source = isCustom ? row.custom_metrics : row.metrics_library;
    return {
      user_metric_id: row.id,
      metric_id: row.metric_id,
      custom_metric_id: row.custom_metric_id,
      name: source?.name ?? "Untitled metric",
      description: source?.description ?? "",
      input_type: source?.input_type ?? "text",
      is_custom: isCustom,
    } satisfies ActiveUserMetric;
  });
}

export async function getTodayPlans(userId: string, entryDate: string): Promise<DailyPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", entryDate);
  if (error) throw error;
  return data ?? [];
}

export async function getTodayEveningReflection(
  userId: string,
  entryDate: string
): Promise<EveningReflection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evening_reflections")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", entryDate)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Most recently used activity, to default the quick-log selector. */
export async function getMostRecentActivityId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quick_logs")
    .select("activity_id")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.activity_id ?? null;
}

export async function getTodayQuickLogs(userId: string, entryDate: string): Promise<QuickLog[]> {
  const supabase = await createClient();
  const start = `${entryDate}T00:00:00.000Z`;
  const end = `${entryDate}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from("quick_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("timestamp", start)
    .lte("timestamp", end)
    .order("timestamp", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Most recent unresolved "setback" for this activity, if any — i.e. a
 * setback-tagged log with no resume-tagged log after it yet.
 */
export async function getOpenSetback(userId: string, activityId: string): Promise<QuickLog | null> {
  const supabase = await createClient();
  const { data: lastSetback, error: setbackErr } = await supabase
    .from("quick_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("activity_id", activityId)
    .eq("tag", "setback")
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (setbackErr) throw setbackErr;
  if (!lastSetback) return null;

  const { data: resolvingResume, error: resumeErr } = await supabase
    .from("quick_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("activity_id", activityId)
    .eq("tag", "resume")
    .gt("timestamp", lastSetback.timestamp)
    .limit(1)
    .maybeSingle();
  if (resumeErr) throw resumeErr;

  return resolvingResume ? null : lastSetback;
}

/** Recent resolved recovery gaps (seconds) for this activity, most-recent-first. */
export async function getRecoveryBaseline(userId: string, activityId: string): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quick_logs")
    .select("value")
    .eq("user_id", userId)
    .eq("activity_id", activityId)
    .eq("tag", "resume")
    .not("value", "is", null)
    .order("timestamp", { ascending: false })
    .limit(BASELINE_WINDOW);
  if (error) throw error;
  return (data ?? []).map((row) => Number(row.value)).filter((n) => !Number.isNaN(n));
}

export { metricKey };
