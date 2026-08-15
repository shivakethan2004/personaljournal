import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveActivities, getActiveUserMetrics } from "@/lib/logging/queries";
import { safeMetricKey } from "@/lib/logging/metric-key";
import type { Activity, ActiveUserMetric, DailyPlan, EveningReflection, QuickLog } from "@/types/logging";

export interface HistoryFilters {
  /** null = all time */
  rangeDays: 7 | 30 | null;
  /** null = every activity */
  activityId: string | null;
  /** null = every metric. A metricKey() string, e.g. "lib:<uuid>" or "custom:<uuid>". */
  metricKey: string | null;
}

export interface DisplayLogEntry {
  id: string;
  timestamp: string;
  activity: Activity;
  metric: ActiveUserMetric | null;
  tag: QuickLog["tag"];
  content: string | null;
  value: number | null;
  /** Only set on a setback entry that has since been resolved. */
  recoverySeconds: number | null;
}

export interface HistoryDay {
  date: string; // YYYY-MM-DD
  plans: (DailyPlan & { activity: Activity })[];
  logs: DisplayLogEntry[];
  reflection: {
    id: string;
    entries: { metric: ActiveUserMetric; text: string; activity: Activity | null }[];
  } | null;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function getHistoryDays(userId: string, filters: HistoryFilters): Promise<{
  days: HistoryDay[];
  activities: Activity[];
  metrics: ActiveUserMetric[];
  isEmpty: boolean; // true only when the account has no data at all, regardless of filters
}> {
  const supabase = await createClient();
  const [activities, metrics] = await Promise.all([
    getActiveActivities(userId),
    getActiveUserMetrics(userId),
  ]);
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const metricByKey = new Map(metrics.map((m) => [safeMetricKey(m.metric_id, m.custom_metric_id), m]));

  const endDate = todayISO();
  const startDate = filters.rangeDays ? isoDaysAgo(filters.rangeDays) : null;

  // ---- daily_plans ----
  let plansQuery = supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", userId)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: false });
  if (startDate) plansQuery = plansQuery.gte("entry_date", startDate);
  if (filters.activityId) plansQuery = plansQuery.eq("activity_id", filters.activityId);
  const { data: plansRaw, error: plansErr } = await plansQuery;
  if (plansErr) throw plansErr;

  // ---- quick_logs (fetch all tags in range; filter/pair below) ----
  let logsQuery = supabase
    .from("quick_logs")
    .select("*")
    .eq("user_id", userId)
    .lte("timestamp", `${endDate}T23:59:59.999Z`)
    .order("timestamp", { ascending: false });
  if (startDate) logsQuery = logsQuery.gte("timestamp", `${startDate}T00:00:00.000Z`);
  if (filters.activityId) logsQuery = logsQuery.eq("activity_id", filters.activityId);
  const { data: allLogsRaw, error: logsErr } = await logsQuery;
  if (logsErr) throw logsErr;
  const allLogs = (allLogsRaw ?? []) as QuickLog[];

  // "resume" rows are bookkeeping (recovery-gap results, see Phase 4) —
  // never shown directly, only used to annotate the setback they resolve.
  const resumeLogs = allLogs.filter((l) => l.tag === "resume");
  const candidateLogs = allLogs.filter((l) => l.tag !== "resume");

  // Metric filter applies to ordinary logs; a setback tap is an event, not
  // a metric reading, so it stays visible even when a metric filter is
  // active (otherwise a bare setback with no metric attached would vanish
  // and its recovery time would become unexplainable in the list).
  const metricFilteredLogs = filters.metricKey
    ? candidateLogs.filter((l) => {
        if (l.tag === "setback") return true;
        return safeMetricKey(l.metric_id, l.custom_metric_id) === filters.metricKey;
      })
    : candidateLogs;

  const displayLogs: DisplayLogEntry[] = metricFilteredLogs
    .map((l) => {
      const activity = activityById.get(l.activity_id);
      if (!activity) return null; // activity deactivated since — skip rather than crash
      const key = safeMetricKey(l.metric_id, l.custom_metric_id);
      const metric = key ? metricByKey.get(key) ?? null : null;

      let recoverySeconds: number | null = null;
      if (l.tag === "setback") {
        const resolving = resumeLogs
          .filter((r) => r.activity_id === l.activity_id && r.timestamp > l.timestamp && r.value !== null)
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
        recoverySeconds = resolving ? Number(resolving.value) : null;
      }

      return {
        id: l.id,
        timestamp: l.timestamp,
        activity,
        metric,
        tag: l.tag,
        content: l.content,
        value: l.value,
        recoverySeconds,
      } satisfies DisplayLogEntry;
    })
    .filter((x): x is DisplayLogEntry => x !== null);

  // ---- evening_reflections ----
  let reflectionsQuery = supabase
    .from("evening_reflections")
    .select("*")
    .eq("user_id", userId)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: false });
  if (startDate) reflectionsQuery = reflectionsQuery.gte("entry_date", startDate);
  const { data: reflectionsRaw, error: reflectionsErr } = await reflectionsQuery;
  if (reflectionsErr) throw reflectionsErr;

  const reflectionsByDate = new Map<string, HistoryDay["reflection"]>();
  for (const row of (reflectionsRaw ?? []) as EveningReflection[]) {
    const responses = row.responses ?? {};
    const entries = Object.entries(responses)
      .map(([key, resp]) => {
        const metric = metricByKey.get(key);
        if (!metric) return null;
        if (filters.metricKey && filters.metricKey !== key) return null;
        const activity = resp.activity_id ? activityById.get(resp.activity_id) ?? null : null;
        if (filters.activityId && (!activity || activity.id !== filters.activityId)) return null;
        return { metric, text: resp.text, activity };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (entries.length > 0) {
      reflectionsByDate.set(row.entry_date, { id: row.id, entries });
    }
  }

  // ---- group everything by date ----
  const plans = (plansRaw ?? [])
    .map((p: DailyPlan) => {
      const activity = activityById.get(p.activity_id);
      return activity ? { ...p, activity } : null;
    })
    .filter((x): x is DailyPlan & { activity: Activity } => x !== null);

  const dateSet = new Set<string>([
    ...plans.map((p) => p.entry_date),
    ...displayLogs.map((l) => l.timestamp.slice(0, 10)),
    ...reflectionsByDate.keys(),
  ]);

  const days: HistoryDay[] = Array.from(dateSet)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => ({
      date,
      plans: plans.filter((p) => p.entry_date === date),
      logs: displayLogs.filter((l) => l.timestamp.slice(0, 10) === date),
      reflection: reflectionsByDate.get(date) ?? null,
    }));

  // Empty state should reflect "no data ever", not "no data matching
  // filters" — an unfiltered check keeps that distinction accurate.
  const { count } = await supabase
    .from("quick_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const isEmpty = (count ?? 0) === 0 && plans.length === 0 && reflectionsByDate.size === 0;

  return { days, activities, metrics, isEmpty };
}
