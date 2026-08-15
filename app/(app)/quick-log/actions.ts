"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOpenSetback, getRecoveryBaseline } from "@/lib/logging/queries";
import { isAmbiguousGap, secondsBetween } from "@/lib/logging/recovery";
import type { CreateQuickLogResult, LogTag, QuickLog } from "@/types/logging";

export interface CreateQuickLogInput {
  activityId: string;
  tag: LogTag;
  metricId?: string | null;
  customMetricId?: string | null;
  content?: string | null;
  value?: number | null;
}

/**
 * Central entry point for every quick log — including the explicit
 * "Back to it" tap, which is just this called with tag: "resume" and no
 * metric attached.
 *
 * Recovery-gap handling:
 *  - tag === "resume": this row IS the resolution. If there's an open
 *    setback for the activity, compute the gap and store it directly on
 *    this row's `value` column.
 *  - tag === "setback": just insert. Opens a new gap.
 *  - tag === null (an ordinary metric log): insert the log as given, then
 *    — per the build plan — treat it as implicitly closing any open
 *    setback for that activity. We record that resolution as a companion
 *    tag:"resume" row (rather than overloading `value`, which may
 *    already hold this log's own metric value) so recovery-time baseline
 *    queries only ever need to look at tag:"resume" rows.
 */
export async function createQuickLog(
  input: CreateQuickLogInput
): Promise<CreateQuickLogResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date();

  if (input.tag === "resume") {
    const result = await resolveViaExplicitResume(supabase, user.id, input.activityId, now);
    revalidatePath("/quick-log");
    revalidatePath("/dashboard");
    return result;
  }

  // Insert the primary log row (setback, or an ordinary metric log).
  const { data: inserted, error } = await supabase
    .from("quick_logs")
    .insert({
      user_id: user.id,
      activity_id: input.activityId,
      timestamp: now.toISOString(),
      metric_id: input.metricId ?? null,
      custom_metric_id: input.customMetricId ?? null,
      tag: input.tag ?? null,
      content: input.content ?? null,
      value: input.value ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  let ambiguousGap: CreateQuickLogResult["ambiguousGap"] = null;

  if (input.tag !== "setback") {
    ambiguousGap = await resolveViaImplicitLog(supabase, user.id, input.activityId, now);
  }

  revalidatePath("/quick-log");
  revalidatePath("/dashboard");

  return { log: inserted as QuickLog, ambiguousGap };
}

async function resolveViaExplicitResume(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  activityId: string,
  now: Date
): Promise<CreateQuickLogResult> {
  const openSetback = await getOpenSetback(userId, activityId);

  let gapSeconds: number | null = null;
  if (openSetback) {
    gapSeconds = secondsBetween(new Date(openSetback.timestamp), now);
  }

  const { data: inserted, error } = await supabase
    .from("quick_logs")
    .insert({
      user_id: userId,
      activity_id: activityId,
      timestamp: now.toISOString(),
      metric_id: null,
      custom_metric_id: null,
      tag: "resume",
      content: openSetback ? null : "back-to-it tap (no open setback found)",
      value: gapSeconds,
    })
    .select("*")
    .single();
  if (error) throw error;

  const ambiguousGap = await maybeFlagAmbiguousGap(
    supabase,
    userId,
    activityId,
    inserted.id,
    gapSeconds
  );

  return { log: inserted as QuickLog, ambiguousGap };
}

async function resolveViaImplicitLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  activityId: string,
  now: Date
): Promise<CreateQuickLogResult["ambiguousGap"]> {
  const openSetback = await getOpenSetback(userId, activityId);
  if (!openSetback) return null;

  const gapSeconds = secondsBetween(new Date(openSetback.timestamp), now);

  const { data: resumeRow, error } = await supabase
    .from("quick_logs")
    .insert({
      user_id: userId,
      activity_id: activityId,
      timestamp: now.toISOString(),
      metric_id: null,
      custom_metric_id: null,
      tag: "resume",
      content: "auto-resolved: next log in this activity",
      value: gapSeconds,
    })
    .select("*")
    .single();
  if (error) throw error;

  return maybeFlagAmbiguousGap(supabase, userId, activityId, resumeRow.id, gapSeconds);
}

async function maybeFlagAmbiguousGap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  activityId: string,
  resumeLogId: string,
  gapSeconds: number | null
): Promise<CreateQuickLogResult["ambiguousGap"]> {
  if (gapSeconds === null) return null;

  // Baseline excludes the gap we just inserted.
  const priorGaps = (await getRecoveryBaseline(userId, activityId)).filter(
    (_, idx) => idx !== 0
  );

  if (!isAmbiguousGap(gapSeconds, priorGaps)) return null;

  const { data: confirmation, error } = await supabase
    .from("recovery_gap_confirmations")
    .insert({
      user_id: userId,
      quick_log_id: resumeLogId,
      gap_seconds: gapSeconds,
      user_confirmed: null,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { confirmationId: confirmation.id, gapSeconds };
}

export async function confirmRecoveryGap(
  confirmationId: string,
  userConfirmed: "recovering" | "break"
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("recovery_gap_confirmations")
    .update({ user_confirmed: userConfirmed })
    .eq("id", confirmationId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/quick-log");
}
