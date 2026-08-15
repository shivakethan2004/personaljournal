import type React from "react";

/**
 * A minimal, deterministic color chip per activity — just enough to keep
 * history/quick-log scannable now. Phase 8 owns the real visual pass; this
 * is intentionally cheap (hash the id to a hue, fixed saturation/lightness)
 * rather than a stored color column, so there's nothing to migrate later
 * if Phase 8 replaces it with user-chosen colors or icons.
 */
export function activityHue(activityId: string): number {
  let hash = 0;
  for (let i = 0; i < activityId.length; i++) {
    hash = (hash * 31 + activityId.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function activityChipStyle(activityId: string): React.CSSProperties {
  const hue = activityHue(activityId);
  return {
    backgroundColor: `hsl(${hue} 70% 94%)`,
    color: `hsl(${hue} 55% 30%)`,
    borderColor: `hsl(${hue} 60% 80%)`,
  };
}

export function activityDotStyle(activityId: string): React.CSSProperties {
  const hue = activityHue(activityId);
  return { backgroundColor: `hsl(${hue} 65% 50%)` };
}
