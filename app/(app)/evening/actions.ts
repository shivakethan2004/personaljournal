"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EveningReflectionResponse } from "@/types/logging";

export interface SaveEveningReflectionInput {
  entryDate: string; // YYYY-MM-DD
  responses: Record<string, EveningReflectionResponse>;
}

/**
 * One reflection row per day (not per activity) — upsert on
 * (user_id, entry_date). `responses` is keyed by metricKey(); see
 * lib/logging/metric-key.ts.
 */
export async function saveEveningReflection(input: SaveEveningReflectionInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("evening_reflections")
    .upsert(
      {
        user_id: user.id,
        entry_date: input.entryDate,
        responses: input.responses,
      },
      { onConflict: "user_id,entry_date" }
    );
  if (error) throw error;

  revalidatePath("/evening");
  revalidatePath("/dashboard");
}
