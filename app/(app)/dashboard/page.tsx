import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveActivities,
  getTodayPlans,
  getTodayEveningReflection,
  getTodayQuickLogs,
} from "@/lib/logging/queries";
import { getTotalLevelUpPoints } from "@/lib/level-up/queries";
import { TodayContent } from "@/components/dashboard/today-content";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const entryDate = todayISO();
  const [activities, plans, reflection, quickLogs, points] = await Promise.all([
    getActiveActivities(user.id),
    getTodayPlans(user.id, entryDate),
    getTodayEveningReflection(user.id, entryDate),
    getTodayQuickLogs(user.id, entryDate),
    getTotalLevelUpPoints(user.id),
  ]);

  return (
    <TodayContent
      entryDate={entryDate}
      activities={activities}
      plans={plans}
      hasReflection={!!reflection}
      quickLogCount={quickLogs.length}
      points={points}
    />
  );
}
