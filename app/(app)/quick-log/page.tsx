import { createClient } from "@/lib/supabase/server";
import { getActiveActivities, getActiveUserMetrics, getMostRecentActivityId } from "@/lib/logging/queries";
import { QuickLogWidget } from "@/components/logging/quick-log-widget";

export default async function QuickLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already guards this route

  const [activities, metrics, recentActivityId] = await Promise.all([
    getActiveActivities(user.id),
    getActiveUserMetrics(user.id),
    getMostRecentActivityId(user.id),
  ]);

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 font-serif text-xl font-semibold">Quick log</h1>
      <QuickLogWidget
        activities={activities}
        metrics={metrics}
        initialActivityId={recentActivityId}
      />
    </main>
  );
}
