"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SaveDailyPlanInput {
  activityId: string;
  entryDate: string; // YYYY-MM-DD
  objectiveText: string | null;
  motivation: number | null; // 0-10
}

/**
 * Upsert on (user_id, entry_date, activity_id) — matches the unique
 * constraint in the schema. Called once per activity the user actually
 * fills in; activities left blank simply get no row, per the build plan
 * ("skipping any activity they don't have a plan for that day").
 */
export async function saveDailyPlan(input: SaveDailyPlanInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("daily_plans")
    .upsert(
      {
        user_id: user.id,
        entry_date: input.entryDate,
        activity_id: input.activityId,
        objective_text: input.objectiveText,
        motivation: input.motivation,
      },
      { onConflict: "user_id,entry_date,activity_id" }
    );
  if (error) throw error;

  revalidatePath("/morning");
  revalidatePath("/dashboard");
}

/** Skipping an activity for today just means deleting any existing row for it. */
export async function clearDailyPlan(activityId: string, entryDate: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("daily_plans")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)
    .eq("activity_id", activityId);
  if (error) throw error;

  revalidatePath("/morning");
  revalidatePath("/dashboard");
}
