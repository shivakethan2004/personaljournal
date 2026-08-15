/**
 * Recovery-time threshold logic.
 *
 * Default rule (per build plan: "if a gap is unusually long compared to
 * the user's normal pattern for that activity, ask one yes/no question —
 * this only fires on genuinely ambiguous gaps"):
 *
 *   - Need at least MIN_SAMPLE_SIZE prior resolved gaps for that activity
 *     before we trust a baseline at all. Below that, never flag — a
 *     single early gap has no "normal pattern" to compare against yet.
 *   - Once there's a baseline, flag if the new gap exceeds
 *     THRESHOLD_MULTIPLIER x the median of recent gaps.
 *   - Median (not mean) so one freak 45-minute gap doesn't drag the
 *     baseline up and mask the next long one.
 */

export const MIN_SAMPLE_SIZE = 3;
export const THRESHOLD_MULTIPLIER = 2;
export const BASELINE_WINDOW = 20; // how many recent resolved gaps to consider

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function isAmbiguousGap(gapSeconds: number, priorGapsSeconds: number[]): boolean {
  if (priorGapsSeconds.length < MIN_SAMPLE_SIZE) return false;
  const baseline = median(priorGapsSeconds);
  if (baseline <= 0) return false;
  return gapSeconds > baseline * THRESHOLD_MULTIPLIER;
}

export function secondsBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000));
}
