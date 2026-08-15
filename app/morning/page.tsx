import { createClient } from "@/lib/supabase/server";
import { getActiveActivities, getTodayPlans } from "@/lib/logging/queries";
import { MorningPlanForm } from "@/components/logging/morning-plan-form";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function MorningPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const entryDate = todayISO();
  const [activities, existingPlans] = await Promise.all([
    getActiveActivities(user.id),
    getTodayPlans(user.id, entryDate),
  ]);

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Morning plan</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Fill in what you're doing today — skip anything that doesn't apply.
      </p>
      <MorningPlanForm activities={activities} existingPlans={existingPlans} entryDate={entryDate} />
    </main>
  );
}
