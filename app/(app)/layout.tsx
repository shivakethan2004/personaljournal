import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  getActiveActivities,
  getActiveUserMetrics,
  getMostRecentActivityId,
} from "@/lib/logging/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [activities, metrics, recentActivityId] = await Promise.all([
    getActiveActivities(user.id),
    getActiveUserMetrics(user.id),
    getMostRecentActivityId(user.id),
  ]);

  return (
    <AppShell activities={activities} metrics={metrics} initialActivityId={recentActivityId}>
      {children}
    </AppShell>
  );
}
