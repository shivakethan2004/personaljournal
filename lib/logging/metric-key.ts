/**
 * user_metrics rows point at EITHER metrics_library OR custom_metrics.
 * Anywhere we need a single string key for a metric (jsonb keys, React
 * list keys, form field names), use this so library and custom metrics
 * never collide.
 */
export function metricKey(metricId: string | null, customMetricId: string | null): string {
  if (metricId) return `lib:${metricId}`;
  if (customMetricId) return `custom:${customMetricId}`;
  throw new Error("metricKey: both metricId and customMetricId are null");
}

export function parseMetricKey(key: string): { metricId: string | null; customMetricId: string | null } {
  if (key.startsWith("lib:")) return { metricId: key.slice(4), customMetricId: null };
  if (key.startsWith("custom:")) return { metricId: null, customMetricId: key.slice(7) };
  throw new Error(`parseMetricKey: malformed key "${key}"`);
}
export function safeMetricKey(metricId: string | null, customMetricId: string | null): string | null {
  if (metricId) return `lib:${metricId}`;
  if (customMetricId) return `custom:${customMetricId}`;
  return null;
}
