// Phase 4 — Daily Logging types.
// If you already have overlapping types in types/domain.ts, merge these in
// rather than importing this file separately — it's split out here just so
// it's easy to review in isolation.

export type InputType = "number" | "text" | "timer" | "tally";
export type LogTag = "setback" | "resume" | null;

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

/**
 * A user's active tracked metric, already resolved against either
 * metrics_library or custom_metrics so the UI doesn't need to care which.
 */
export interface ActiveUserMetric {
  user_metric_id: string;
  metric_id: string | null;
  custom_metric_id: string | null;
  name: string;
  description: string;
  input_type: InputType;
  is_custom: boolean;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  activity_id: string;
  objective_text: string | null;
  motivation: number | null; // 0-10
  created_at: string;
}

export interface QuickLog {
  id: string;
  user_id: string;
  timestamp: string; // ISO
  activity_id: string;
  metric_id: string | null;
  custom_metric_id: string | null;
  tag: LogTag;
  content: string | null;
  value: number | null;
}

export interface RecoveryGapConfirmation {
  id: string;
  user_id: string;
  quick_log_id: string;
  gap_seconds: number;
  user_confirmed: "recovering" | "break" | null;
}

/** responses is keyed by a "metric key" — see lib/logging/metric-key.ts */
export interface EveningReflectionResponse {
  text: string;
  activity_id?: string;
}

export interface EveningReflection {
  id: string;
  user_id: string;
  entry_date: string;
  responses: Record<string, EveningReflectionResponse>;
  created_at: string;
}

/** Result shape returned by the createQuickLog action, so the client
 * knows whether to pop the ambiguous-gap confirmation prompt. */
export interface CreateQuickLogResult {
  log: QuickLog;
  ambiguousGap: {
    confirmationId: string;
    gapSeconds: number;
  } | null;
}
