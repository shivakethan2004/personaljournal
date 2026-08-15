"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { ActivitySelector } from "./activity-selector";
import { MetricInput, type MetricInputValue } from "./metric-input";
import { RecoveryGapPrompt } from "./recovery-gap-prompt";
import { createQuickLog } from "@/app/quick-log/actions";
import { metricKey } from "@/lib/logging/metric-key";
import type { Activity, ActiveUserMetric } from "@/types/logging";

interface QuickLogWidgetProps {
  activities: Activity[];
  metrics: ActiveUserMetric[];
  initialActivityId: string | null;
  /** Called after any successful submit, so a parent list/history can refresh. */
  onLogged?: () => void;
}

export function QuickLogWidget({
  activities,
  metrics,
  initialActivityId,
  onLogged,
}: QuickLogWidgetProps) {
  const [activityId, setActivityId] = useState<string | null>(
    initialActivityId ?? activities[0]?.id ?? null
  );
  const [isSetback, setIsSetback] = useState(false);
  const [values, setValues] = useState<Record<string, MetricInputValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [backToItLoading, setBackToItLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    confirmationId: string;
    gapSeconds: number;
  } | null>(null);
  const [justLogged, setJustLogged] = useState(false);

  const updateValue = (key: string, next: MetricInputValue) => {
    setValues((prev) => ({ ...prev, [key]: next }));
  };

  const hasAnyMetricInput = Object.values(values).some(
    (v) => v.value !== null || (v.content && v.content.trim().length > 0)
  );

  const reset = () => {
    setValues({});
    setIsSetback(false);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1500);
  };

  const handleSubmit = async () => {
    if (!activityId) return;
    setSubmitting(true);
    try {
      const filledMetrics = metrics.filter((m) => {
        const v = values[metricKey(m.metric_id, m.custom_metric_id)];
        return v && (v.value !== null || (v.content && v.content.trim().length > 0));
      });

      if (filledMetrics.length === 0) {
        // No metric touched — a bare setback tap (or nothing to do).
        if (!isSetback) return;
        const result = await createQuickLog({ activityId, tag: "setback" });
        if (result.ambiguousGap) setPendingConfirmation(result.ambiguousGap);
      } else {
        for (let i = 0; i < filledMetrics.length; i++) {
          const m = filledMetrics[i];
          const v = values[metricKey(m.metric_id, m.custom_metric_id)];
          const result = await createQuickLog({
            activityId,
            tag: i === 0 && isSetback ? "setback" : null,
            metricId: m.metric_id,
            customMetricId: m.custom_metric_id,
            value: v.value,
            content: v.content,
          });
          if (result.ambiguousGap) setPendingConfirmation(result.ambiguousGap);
        }
      }

      reset();
      onLogged?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToIt = async () => {
    if (!activityId) return;
    setBackToItLoading(true);
    try {
      const result = await createQuickLog({ activityId, tag: "resume" });
      if (result.ambiguousGap) setPendingConfirmation(result.ambiguousGap);
      onLogged?.();
    } finally {
      setBackToItLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ActivitySelector activities={activities} value={activityId} onChange={setActivityId} />

      <div className="flex items-center justify-between gap-2">
        <Toggle
          pressed={isSetback}
          onPressedChange={setIsSetback}
          variant="outline"
          className="gap-2 data-[state=on]:border-destructive data-[state=on]:text-destructive"
        >
          <AlertTriangle className="h-4 w-4" />
          Setback
        </Toggle>
        <Button variant="ghost" size="sm" onClick={handleBackToIt} disabled={backToItLoading}>
          {backToItLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Back to it
        </Button>
      </div>

      <div className="space-y-2">
        {metrics.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No active metrics yet — add some in Settings.
          </p>
        )}
        {metrics.map((m) => {
          const key = metricKey(m.metric_id, m.custom_metric_id);
          return (
            <MetricInput
              key={key}
              metric={m}
              value={values[key] ?? { value: null, content: null }}
              onChange={(v) => updateValue(key, v)}
            />
          );
        })}
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting || !activityId || (!hasAnyMetricInput && !isSetback)}
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {justLogged ? "Logged" : "Log it"}
      </Button>

      {pendingConfirmation && (
        <RecoveryGapPrompt
          confirmationId={pendingConfirmation.confirmationId}
          gapSeconds={pendingConfirmation.gapSeconds}
          onDone={() => setPendingConfirmation(null)}
        />
      )}
    </div>
  );
}
