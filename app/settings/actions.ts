"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InputType } from "@/types/domain";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function setUserMetricActive(userMetricId: string, active: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_metrics")
    .update({ active })
    .eq("id", userMetricId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function addLibraryMetric(metricId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_metrics").insert({
    user_id: user.id,
    metric_id: metricId,
    custom_metric_id: null,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function addCustomMetric(input: {
  name: string;
  description: string;
  input_type: InputType;
}) {
  const { supabase, user } = await requireUser();

  const { data: metric, error: createError } = await supabase
    .from("custom_metrics")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      input_type: input.input_type,
    })
    .select("id")
    .single();

  if (createError) throw new Error(createError.message);

  const { error: linkError } = await supabase.from("user_metrics").insert({
    user_id: user.id,
    metric_id: null,
    custom_metric_id: metric.id,
    active: true,
  });
  if (linkError) throw new Error(linkError.message);

  revalidatePath("/settings");
}

export async function setActivityActive(activityId: string, active: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("activities")
    .update({ active })
    .eq("id", activityId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function addActivity(input: { name: string; description: string }) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("activities").insert({
    user_id: user.id,
    name: input.name,
    description: input.description || null,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}