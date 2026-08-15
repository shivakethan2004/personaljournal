import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LevelUpTask, LevelUpSubmissionWithTask } from "@/types/level-up";

/**
 * The "current" task, if any — a task not yet evaluated. Once a task's
 * status flips to 'evaluated', it drops out here and GenerateTaskCard
 * takes over again on /level-up. This is the one-task-at-a-time loop
 * implied by the build plan's "pending task" + "running total" framing.
 */
export async function getCurrentLevelUpTask(userId: string): Promise<LevelUpTask | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("level_up_tasks")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "submitted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Evaluated tasks + their submissions, most recent first. */
export async function getLevelUpHistory(
  userId: string,
  limit = 10
): Promise<LevelUpSubmissionWithTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("level_up_submissions")
    .select(
      `id, task_id, user_id, submission_text, ai_feedback, points_awarded, created_at,
       level_up_tasks ( id, task_text, activity_id, status )`
    )
    .eq("user_id", userId)
    .not("points_awarded", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as LevelUpSubmissionWithTask[];
}

/**
 * Quiet running total — no badges, no streaks, per the build plan.
 * Exported separately from getLevelUpHistory so a dashboard widget can
 * pull just the number without paying for the join.
 */
export async function getTotalLevelUpPoints(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("level_up_submissions")
    .select("points_awarded")
    .eq("user_id", userId)
    .not("points_awarded", "is", null);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + (row.points_awarded ?? 0), 0);
}