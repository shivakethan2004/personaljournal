import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SettingsClient,
  type LibraryMetricOption,
  type SettingsActivityRow,
  type SettingsMetricRow,
} from "./settings-client";
import type { InputType } from "@/types/domain";

type UserMetricJoined = {
  id: string;
  active: boolean;
  metric_id: string | null;
  custom_metric_id: string | null;
  metrics_library: { name: string; input_type: InputType } | null;
  custom_metrics: { name: string; input_type: InputType } | null;
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [userMetricsRes, allLibraryMetricsRes, activitiesRes] = await Promise.all([
    supabase
      .from("user_metrics")
      .select(
        "id, active, metric_id, custom_metric_id, metrics_library ( name, input_type ), custom_metrics ( name, input_type )"
      )
      .eq("user_id", user.id)
      .returns<UserMetricJoined[]>(),
    supabase.from("metrics_library").select("id, name, input_type"),
    supabase
      .from("activities")
      .select("id, name, active")
      .eq("user_id", user.id)
      .order("created_at"),
  ]);

  if (userMetricsRes.error) throw new Error(userMetricsRes.error.message);
  if (allLibraryMetricsRes.error) throw new Error(allLibraryMetricsRes.error.message);
  if (activitiesRes.error) throw new Error(activitiesRes.error.message);

  const userMetrics = userMetricsRes.data ?? [];

  const trackedMetrics: SettingsMetricRow[] = userMetrics.map((m) => ({
    userMetricId: m.id,
    name: m.metrics_library?.name ?? m.custom_metrics?.name ?? "Untitled metric",
    inputType: (m.metrics_library?.input_type ?? m.custom_metrics?.input_type ?? "number") as InputType,
    active: m.active,
  }));

  const trackedLibraryIds = new Set(
    userMetrics.map((m) => m.metric_id).filter((id): id is string => !!id)
  );

  const availableLibraryMetrics: LibraryMetricOption[] = (allLibraryMetricsRes.data ?? [])
    .filter((m) => !trackedLibraryIds.has(m.id))
    .map((m) => ({ id: m.id, name: m.name, inputType: m.input_type as InputType }));

  const activities: SettingsActivityRow[] = activitiesRes.data ?? [];

  return (
    <SettingsClient
      trackedMetrics={trackedMetrics}
      availableLibraryMetrics={availableLibraryMetrics}
      activities={activities}
    />
  );
}