import { createClient } from "@/lib/supabase/server";
import { getTotalLevelUpPoints } from "@/lib/level-up/queries";

/**
 * Deliberately plain — per the build plan: "a quiet running total of
 * points on the dashboard — no badges, no streak counters, no
 * leaderboard." Just the number.
 */
export async function PointsTotalBadge() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const points = await getTotalLevelUpPoints(user.id);

  return <p className="text-sm text-muted-foreground">{points} pts</p>;
}