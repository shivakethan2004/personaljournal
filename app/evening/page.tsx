import { createClient } from "@/lib/supabase/server";
import { getActiveActivities, getActiveUserMetrics, getTodayEveningReflection } from "@/lib/logging/queries";
import { EveningReflectionForm } from "@/components/logging/evening-reflection-form";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function EveningReflectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const entryDate = todayISO();
  const [activities, metrics, existingReflection] = await Promise.all([
    getActiveActivities(user.id),
    getActiveUserMetrics(user.id),
    getTodayEveningReflection(user.id, entryDate),
  ]);
  const textMetrics = metrics.filter((m) => m.input_type === "text");

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Evening reflection</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        One entry for the whole day — tag individual answers to an activity if it's relevant.
      </p>
      <EveningReflectionForm
        textMetrics={textMetrics}
        activities={activities}
        existingReflection={existingReflection}
        entryDate={entryDate}
      />
    </main>
  );
}
