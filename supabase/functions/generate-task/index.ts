import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callTogether } from "./together.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateTaskBody {
  activityId?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Not authenticated" }, 401);

    let body: GenerateTaskBody = {};
    try {
      body = await req.json();
    } catch {
      // no body sent — treat as a general (unscoped) task
    }
    const activityId = body.activityId ?? null;

    // --- Resolve + validate the activity, if one was chosen ---
    let activityName: string | null = null;
    if (activityId) {
      const { data: activity, error: activityError } = await supabase
        .from("activities")
        .select("name")
        .eq("id", activityId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (activityError) throw activityError;
      if (!activity) return jsonResponse({ error: "Activity not found" }, 404);
      activityName = activity.name;
    }

    // --- Recent journal context, filtered to the activity if chosen ---
    let logsQuery = supabase
      .from("quick_logs")
      .select("timestamp, tag, content, value")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(20);
    if (activityId) logsQuery = logsQuery.eq("activity_id", activityId);
    const { data: recentLogs, error: logsError } = await logsQuery;
    if (logsError) throw logsError;

    let plansQuery = supabase
      .from("daily_plans")
      .select("entry_date, objective_text, motivation")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(5);
    if (activityId) plansQuery = plansQuery.eq("activity_id", activityId);
    const { data: recentPlans, error: plansError } = await plansQuery;
    if (plansError) throw plansError;

    // Evening reflections aren't per-activity, so these are pulled
    // regardless of scope — they're general context either way.
    const { data: recentReflections, error: reflectionsError } = await supabase
      .from("evening_reflections")
      .select("entry_date, responses")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(3);
    if (reflectionsError) throw reflectionsError;

    // --- Build the prompt ---
    const contextLines: string[] = [];
    contextLines.push(
      activityName
        ? `Scope: the task should be about the activity "${activityName}" specifically.`
        : `Scope: general — not tied to one activity.`
    );

    contextLines.push("\nRecent logs:");
    if (!recentLogs || recentLogs.length === 0) {
      contextLines.push("- no recent logs");
    } else {
      for (const log of recentLogs) {
        const parts = [
          log.tag ? `tag=${log.tag}` : null,
          log.value !== null ? `value=${log.value}` : null,
          log.content ? `note="${log.content}"` : null,
        ].filter(Boolean);
        contextLines.push(`- ${log.timestamp}: ${parts.join(", ") || "logged"}`);
      }
    }

    contextLines.push("\nRecent morning plans:");
    if (!recentPlans || recentPlans.length === 0) {
      contextLines.push("- no recent plans");
    } else {
      for (const plan of recentPlans) {
        contextLines.push(
          `- ${plan.entry_date}: objective="${plan.objective_text ?? "none"}", motivation=${
            plan.motivation ?? "n/a"
          }`
        );
      }
    }

    contextLines.push("\nRecent evening reflections:");
    if (!recentReflections || recentReflections.length === 0) {
      contextLines.push("- no recent reflections");
    } else {
      for (const r of recentReflections) {
        const responses = (r.responses ?? {}) as Record<string, { text?: string } | string>;
        const lines = Object.values(responses)
          .map((v) => (typeof v === "string" ? v : v?.text ?? ""))
          .filter(Boolean);
        contextLines.push(`- ${r.entry_date}: ${lines.join(" | ") || "no answers"}`);
      }
    }

    const systemPrompt = `You generate one small, specific, slightly fun "level up" task for a self-tracking journaling app. The task must be concrete and doable in a single sitting, grounded in the person's actual recent activity below — not generic self-improvement advice, not vague. Keep it to one or two sentences. Output ONLY the task text itself — no preamble, no quotation marks, no explanation.`;

    const userPrompt = `${contextLines.join("\n")}\n\nGive me one task.`;

    const taskText = (
      await callTogether(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        { maxTokens: 150, temperature: 0.6 }
      )
    ).trim();

    const { data: savedTask, error: saveError } = await supabase
      .from("level_up_tasks")
      .insert({
        user_id: user.id,
        task_text: taskText,
        activity_id: activityId,
        status: "pending",
      })
      .select("id, task_text, activity_id, status, created_at")
      .single();
    if (saveError) throw saveError;

    return jsonResponse({ task: savedTask });
  } catch (err) {
    console.error("generate-task error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unknown error generating task" },
      500
    );
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}