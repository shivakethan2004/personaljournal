import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callTogether, safeParseJsonObject } from "./together.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvaluateTaskBody {
  submissionId: string;
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

    let body: EvaluateTaskBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Missing submissionId in request body" }, 400);
    }
    if (!body.submissionId) return jsonResponse({ error: "Missing submissionId in request body" }, 400);

    const { data: submission, error: submissionError } = await supabase
      .from("level_up_submissions")
      .select("id, task_id, submission_text")
      .eq("id", body.submissionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (submissionError) throw submissionError;
    if (!submission) return jsonResponse({ error: "Submission not found" }, 404);

    const { data: task, error: taskError } = await supabase
      .from("level_up_tasks")
      .select("id, task_text")
      .eq("id", submission.task_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (taskError) throw taskError;
    if (!task) return jsonResponse({ error: "Task not found" }, 404);

    const systemPrompt = `You evaluate a self-reported task completion for a self-tracking journaling app. Give honest, specific feedback grounded only in what the person actually describes doing. Base your judgment entirely on effort and honesty — never on outcome, how impressive it sounds, or how well it went. A modest, honest effort deserves a fair score; a vague or inflated-sounding report deserves a lower one regardless of the claimed result. Respond with ONLY a JSON object, no other text, in this exact shape: {"feedback": "<2-3 sentences, plain factual language, no praise inflation>", "points": <integer 1-10>}`;

    const userPrompt = `Task given: "${task.task_text}"\n\nWhat the person reported: "${submission.submission_text}"\n\nEvaluate now.`;

    const raw = await callTogether(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 300, temperature: 0.2 }
    );

    const parsed = safeParseJsonObject(raw) as { feedback?: string; points?: number } | null;
    const feedback =
      parsed?.feedback?.trim() || "No feedback could be generated for this submission.";
    let points = Number(parsed?.points);
    if (!Number.isFinite(points)) points = 1;
    points = Math.min(10, Math.max(1, Math.round(points)));

    const { data: updatedSubmission, error: updateSubError } = await supabase
      .from("level_up_submissions")
      .update({ ai_feedback: feedback, points_awarded: points })
      .eq("id", submission.id)
      .select("id, task_id, submission_text, ai_feedback, points_awarded, created_at")
      .single();
    if (updateSubError) throw updateSubError;

    const { data: updatedTask, error: updateTaskError } = await supabase
      .from("level_up_tasks")
      .update({ status: "evaluated" })
      .eq("id", task.id)
      .select("id, task_text, activity_id, status, created_at")
      .single();
    if (updateTaskError) throw updateTaskError;

    return jsonResponse({ submission: updatedSubmission, task: updatedTask });
  } catch (err) {
    console.error("evaluate-task error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unknown error evaluating task" },
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