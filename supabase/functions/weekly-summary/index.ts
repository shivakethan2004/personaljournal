import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callTogether, safeParseJsonArray } from "./together.ts";
import { pairRecoveryGaps, type QuickLogRow } from "./recovery-pairs.ts";
import { buildActivityGroups, type ActiveMetric, type GroupedWeek } from "./grouping.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    // RLS-scoped client — forwards the caller's own JWT rather than using
    // the service role, so every query below is naturally limited to
    // this user's rows without extra .eq('user_id', ...) risk.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    // --- Week window: last 7 days including today, in UTC ---
    const today = new Date();
    const weekStartDate = new Date(today);
    weekStartDate.setUTCDate(weekStartDate.getUTCDate() - 6);
    const weekStartDateStr = weekStartDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const weekStartISO = `${weekStartDateStr}T00:00:00.000Z`;

    // --- Active metrics (library + custom) ---
    const { data: userMetricRows, error: metricsError } = await supabase
      .from("user_metrics")
      .select(
        `metric_id, custom_metric_id,
         metrics_library ( id, name, description ),
         custom_metrics ( id, name, description )`
      )
      .eq("user_id", user.id)
      .eq("active", true);
    if (metricsError) throw metricsError;

    const activeMetrics: ActiveMetric[] = (userMetricRows ?? [])
      .map((row: any) => {
        if (row.metric_id && row.metrics_library) {
          return {
            key: `lib:${row.metrics_library.id}`,
            id: row.metrics_library.id,
            type: "library" as const,
            name: row.metrics_library.name,
            description: row.metrics_library.description,
          };
        }
        if (row.custom_metric_id && row.custom_metrics) {
          return {
            key: `custom:${row.custom_metrics.id}`,
            id: row.custom_metrics.id,
            type: "custom" as const,
            name: row.custom_metrics.name,
            description: row.custom_metrics.description,
          };
        }
        return null;
      })
      .filter((m: ActiveMetric | null): m is ActiveMetric => m !== null);

    // --- Activities ---
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select("id, name")
      .eq("user_id", user.id);
    if (activitiesError) throw activitiesError;

    // --- Week's raw data ---
    const { data: dailyPlans, error: plansError } = await supabase
      .from("daily_plans")
      .select("entry_date, activity_id, objective_text, motivation")
      .eq("user_id", user.id)
      .gte("entry_date", weekStartDateStr);
    if (plansError) throw plansError;

    const { data: quickLogsRaw, error: logsError } = await supabase
      .from("quick_logs")
      .select("id, timestamp, activity_id, metric_id, custom_metric_id, tag, content, value")
      .eq("user_id", user.id)
      .gte("timestamp", weekStartISO);
    if (logsError) throw logsError;
    const quickLogs = (quickLogsRaw ?? []) as QuickLogRow[];

    const { data: reflections, error: reflectionsError } = await supabase
      .from("evening_reflections")
      .select("entry_date, responses")
      .eq("user_id", user.id)
      .gte("entry_date", weekStartDateStr);
    if (reflectionsError) throw reflectionsError;

    // --- Step 1: classify freeform notes that have no metric attached yet ---
    // Excludes setback/resume rows (bookkeeping, content isn't user prose).
    const unclassified = quickLogs.filter(
      (log) =>
        log.tag === null &&
        log.metric_id === null &&
        log.custom_metric_id === null &&
        typeof log.content === "string" &&
        log.content.trim().length > 0
    );

    if (unclassified.length > 0 && activeMetrics.length > 0) {
      const classifications = await classifyNotes(unclassified, activeMetrics);

      for (const c of classifications) {
        if (!c.metricKey) continue;
        const matched = activeMetrics.find((m) => m.key === c.metricKey);
        if (!matched) continue;

        const update =
          matched.type === "library"
            ? { metric_id: matched.id }
            : { custom_metric_id: matched.id };

        const { error: updateError } = await supabase
          .from("quick_logs")
          .update(update)
          .eq("id", c.quickLogId)
          .eq("user_id", user.id);

        if (updateError) {
          // Non-fatal: skip this one, keep going. A note that fails to
          // save its classification just gets re-offered next week since
          // it still has null metric_id/custom_metric_id.
          console.error("Failed to save classification for log", c.quickLogId, updateError);
          continue;
        }

        // Reflect the update in-memory so this week's own prompt below
        // groups the note under its metric instead of dropping it.
        const localLog = quickLogs.find((l) => l.id === c.quickLogId);
        if (localLog) Object.assign(localLog, update);
      }
    }

    // --- Step 2: group by activity, pair recovery gaps ---
    const recoveryPairs = pairRecoveryGaps(quickLogs);
    const grouped = buildActivityGroups({
      activities: activities ?? [],
      dailyPlans: dailyPlans ?? [],
      quickLogs,
      reflections: reflections ?? [],
      recoveryPairs,
      activeMetrics,
    });

    // --- Step 3: pattern-observer narrative ---
    const summaryText = await generateWeeklyNarrative(grouped, weekStartDateStr);

    // --- Step 4: persist + return ---
    const { data: saved, error: saveError } = await supabase
      .from("weekly_summaries")
      .insert({
        user_id: user.id,
        week_start: weekStartDateStr,
        summary_text: summaryText,
      })
      .select("id, week_start, summary_text, created_at")
      .single();
    if (saveError) throw saveError;

    return jsonResponse({ summary: saved });
  } catch (err) {
    console.error("weekly-summary error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unknown error generating summary" },
      500
    );
  }
});

// ---------------------------------------------------------------------------

async function classifyNotes(
  notes: QuickLogRow[],
  metrics: ActiveMetric[]
): Promise<{ quickLogId: string; metricKey: string | null }[]> {
  const metricList = metrics
    .map(
      (m) =>
        `- key: "${m.key}", name: "${m.name}"${m.description ? `, description: "${m.description}"` : ""}`
    )
    .join("\n");

  const noteList = notes
    .map((n) => `- id: "${n.id}", note: "${(n.content ?? "").replace(/"/g, "'")}"`)
    .join("\n");

  const prompt = `You are classifying short freeform journal notes against a fixed list of metrics.

Metrics:
${metricList}

Notes to classify:
${noteList}

For each note, decide which single metric (by its "key") it is most clearly about, or "none" if it doesn't clearly relate to any of them. Do not guess if it's ambiguous — use "none".

Respond with ONLY a JSON array, no other text, in this exact shape:
[{"id": "<note id>", "metricKey": "<matching key or none>"}]`;

  const raw = await callTogether(
    [
      { role: "system", content: "You output only valid JSON. No prose, no markdown fences." },
      { role: "user", content: prompt },
    ],
    { maxTokens: 800 }
  );

  const parsed = safeParseJsonArray(raw) as { id: string; metricKey: string }[];
  return parsed
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({
      quickLogId: item.id,
      metricKey: item.metricKey && item.metricKey !== "none" ? item.metricKey : null,
    }));
}

async function generateWeeklyNarrative(
  grouped: GroupedWeek,
  weekStartDateStr: string
): Promise<string> {
  const activitySections = grouped.groups
    .map((g) => {
      const planLines =
        g.plans
          .map(
            (p) =>
              `  - ${p.date}: objective="${p.objective ?? "none"}", motivation=${p.motivation ?? "n/a"}`
          )
          .join("\n") || "  - no morning plans logged";

      const metricLines =
        g.metricLogs.map((m) => `  - ${m.metricName}: [${m.values.join(", ")}]`).join("\n") ||
        "  - no metric logs";

      const setbackLines =
        g.setbacks
          .map(
            (s) =>
              `  - setback at ${s.setbackAt}${
                s.gapMinutes !== null ? `, recovered in ${s.gapMinutes} min` : ", not yet recovered"
              }`
          )
          .join("\n") || "  - no setbacks";

      return `Activity: ${g.activityName}\nPlans:\n${planLines}\nMetric logs:\n${metricLines}\nSetbacks:\n${setbackLines}`;
    })
    .join("\n\n");

  const reflectionSection = grouped.generalReflections.length
    ? grouped.generalReflections.join("\n")
    : "no evening reflections logged this week";

  const systemPrompt = `You are a neutral pattern-observer for a self-tracking journaling app. You report only repeated patterns that are actually visible in the data given to you. You never invent numbers or claims not supported by the data. Specifically call out cross-activity comparisons where the data supports them (e.g. recovery time being longer after one activity than another). Use plain, factual language. 4-5 sentences maximum. No motivational language, no encouragement, no praise, no advice.`;

  const userPrompt = `Week starting ${weekStartDateStr}. Data grouped by activity:

${activitySections}

Evening reflections this week:
${reflectionSection}

Write the pattern summary now, following the system instructions exactly.`;

  const result = await callTogether(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 400 }
  );

  return result.trim();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}