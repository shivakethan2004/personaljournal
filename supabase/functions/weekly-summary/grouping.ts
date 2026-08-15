import type { QuickLogRow, RecoveryPair } from "./recovery-pairs.ts";

export interface ActiveMetric {
  key: string; // "lib:<uuid>" | "custom:<uuid>" — matches metricKey() convention in lib/logging/metric-key.ts
  id: string;
  type: "library" | "custom";
  name: string;
  description: string | null;
}

interface Activity {
  id: string;
  name: string;
}

interface DailyPlan {
  entry_date: string;
  activity_id: string;
  objective_text: string | null;
  motivation: number | null;
}

interface EveningReflection {
  entry_date: string;
  responses: Record<string, { text?: string; activity_id?: string } | string> | null;
}

export interface ActivityGroup {
  activityId: string;
  activityName: string;
  plans: { date: string; objective: string | null; motivation: number | null }[];
  metricLogs: { metricName: string; values: (number | string)[] }[];
  setbacks: { setbackAt: string; recoveredAt: string | null; gapMinutes: number | null }[];
}

export interface GroupedWeek {
  groups: ActivityGroup[];
  generalReflections: string[];
}

export function buildActivityGroups(input: {
  activities: Activity[];
  dailyPlans: DailyPlan[];
  quickLogs: QuickLogRow[];
  reflections: EveningReflection[];
  recoveryPairs: RecoveryPair[];
  activeMetrics: ActiveMetric[];
}): GroupedWeek {
  const metricNameByKey = new Map(input.activeMetrics.map((m) => [m.key, m.name]));

  const groups: ActivityGroup[] = input.activities.map((activity) => {
    const plans = input.dailyPlans
      .filter((p) => p.activity_id === activity.id)
      .map((p) => ({
        date: p.entry_date,
        objective: p.objective_text,
        motivation: p.motivation,
      }));

    // Ordinary metric logs only — setback/resume rows are bookkeeping,
    // handled separately via recoveryPairs.
    const logsForActivity = input.quickLogs.filter(
      (l) => l.activity_id === activity.id && l.tag === null
    );

    const metricLogsMap = new Map<string, (number | string)[]>();
    for (const log of logsForActivity) {
      const key = log.metric_id
        ? `lib:${log.metric_id}`
        : log.custom_metric_id
        ? `custom:${log.custom_metric_id}`
        : null;
      if (!key) continue; // still unclassified after the classification step — skip rather than guess
      const name = metricNameByKey.get(key) ?? "Unrecognized metric";
      const arr = metricLogsMap.get(name) ?? [];
      arr.push(log.value ?? log.content ?? "");
      metricLogsMap.set(name, arr);
    }

    const setbacks = input.recoveryPairs
      .filter((p) => p.activityId === activity.id)
      .map((p) => ({
        setbackAt: p.setbackAt,
        recoveredAt: p.recoveredAt,
        gapMinutes: p.gapSeconds !== null ? Math.round(p.gapSeconds / 60) : null,
      }));

    return {
      activityId: activity.id,
      activityName: activity.name,
      plans,
      metricLogs: Array.from(metricLogsMap.entries()).map(([metricName, values]) => ({
        metricName,
        values,
      })),
      setbacks,
    };
  });

  const generalReflections = input.reflections.map((r) => {
    const responses = r.responses ?? {};
    const lines = Object.entries(responses).map(([metricKey, value]) => {
      const text = typeof value === "string" ? value : value?.text ?? "";
      return `${metricNameByKey.get(metricKey) ?? metricKey}: ${text}`;
    });
    return `${r.entry_date} — ${lines.join(" | ") || "no answers"}`;
  });

  return { groups, generalReflections };
}