export interface QuickLogRow {
  id: string;
  timestamp: string;
  activity_id: string;
  metric_id: string | null;
  custom_metric_id: string | null;
  tag: "setback" | "resume" | null;
  content: string | null;
  value: number | null;
}

export interface RecoveryPair {
  activityId: string;
  setbackAt: string;
  recoveredAt: string | null;
  gapSeconds: number | null;
}

/**
 * Pairs each 'setback' row with the earliest not-yet-used 'resume' row for
 * the same activity that happened later — same rule used by
 * lib/logging/history.ts for the History page. This does NOT compute the
 * gap itself; gapSeconds comes straight from the resume row's `value`
 * column, which app/quick-log/actions.ts already populated at log time.
 *
 * Known limitation (inherited from History, per the process journal):
 * a setback logged near the end of the 7-day window whose resume lands
 * after the window will show as "not yet recovered" here, since we only
 * ever fetch rows inside the week.
 */
export function pairRecoveryGaps(logs: QuickLogRow[]): RecoveryPair[] {
  const byActivity = new Map<string, QuickLogRow[]>();
  for (const log of logs) {
    if (log.tag !== "setback" && log.tag !== "resume") continue;
    const arr = byActivity.get(log.activity_id) ?? [];
    arr.push(log);
    byActivity.set(log.activity_id, arr);
  }

  const pairs: RecoveryPair[] = [];

  for (const [activityId, entries] of byActivity) {
    const setbacks = entries
      .filter((e) => e.tag === "setback")
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const resumes = entries
      .filter((e) => e.tag === "resume")
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    const usedResumeIds = new Set<string>();

    for (const setback of setbacks) {
      const match = resumes.find(
        (r) =>
          !usedResumeIds.has(r.id) &&
          Date.parse(r.timestamp) > Date.parse(setback.timestamp)
      );

      if (match) {
        usedResumeIds.add(match.id);
        pairs.push({
          activityId,
          setbackAt: setback.timestamp,
          recoveredAt: match.timestamp,
          gapSeconds: match.value,
        });
      } else {
        pairs.push({
          activityId,
          setbackAt: setback.timestamp,
          recoveredAt: null,
          gapSeconds: null,
        });
      }
    }
  }

  return pairs;
}