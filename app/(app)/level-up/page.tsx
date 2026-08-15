import { createClient } from "@/lib/supabase/server";
import { getActiveActivities } from "@/lib/logging/queries";
import {
  getCurrentLevelUpTask,
  getLevelUpHistory,
  getTotalLevelUpPoints,
} from "@/lib/level-up/queries";
import { GenerateTaskCard } from "@/components/level-up/generate-task-card";
import { PendingTaskCard } from "@/components/level-up/pending-task-card";
import { LevelUpHistoryList } from "@/components/level-up/level-up-history-list";

export default async function LevelUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [activities, currentTask, history, totalPoints] = await Promise.all([
    getActiveActivities(user.id),
    getCurrentLevelUpTask(user.id),
    getLevelUpHistory(user.id),
    getTotalLevelUpPoints(user.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Level Up</h1>
        <span className="tabular-figures text-sm text-muted-foreground">{totalPoints} pts</span>
      </div>

      {currentTask ? (
        <PendingTaskCard task={currentTask} />
      ) : (
        <GenerateTaskCard activities={activities} />
      )}

      {history.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Past tasks</h2>
          <LevelUpHistoryList items={history} />
        </div>
      )}
    </main>
  );
}