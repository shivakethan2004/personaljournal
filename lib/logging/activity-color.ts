import type React from "react";

/**
 * Activities are assigned a color from a small, curated set of "pen"
 * colors (defined as CSS custom properties in globals.css) rather than a
 * randomly hashed hue — it should read like picking a different colored
 * pen for each notebook, not an arbitrary rainbow.
 */
const PEN_COUNT = 8;

function penIndex(activityId: string): number {
  let hash = 0;
  for (let i = 0; i < activityId.length; i++) {
    hash = (hash * 31 + activityId.charCodeAt(i)) >>> 0;
  }
  return (hash % PEN_COUNT) + 1;
}

export function activityPenVar(activityId: string): string {
  return `var(--pen-${penIndex(activityId)})`;
}

export function activityChipStyle(activityId: string): React.CSSProperties {
  const pen = activityPenVar(activityId);
  return {
    color: pen,
    borderColor: pen,
    backgroundColor: "var(--card)",
  };
}

export function activityDotStyle(activityId: string): React.CSSProperties {
  return { backgroundColor: activityPenVar(activityId) };
}
