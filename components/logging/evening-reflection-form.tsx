"use client";

import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import { saveEveningReflection } from "@/app/(app)/evening/actions";
import { metricKey } from "@/lib/logging/metric-key";
import type { Activity, ActiveUserMetric, EveningReflection, EveningReflectionResponse } from "@/types/logging";

interface EveningReflectionFormProps {
  textMetrics: ActiveUserMetric[];
  activities: Activity[];
  existingReflection: EveningReflection | null;
  entryDate: string;
}

export function EveningReflectionForm({
  textMetrics,
  activities,
  existingReflection,
  entryDate,
}: EveningReflectionFormProps) {
  const [responses, setResponses] = useState<Record<string, EveningReflectionResponse>>(
    existingReflection?.responses ?? {}
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!existingReflection);

  const updateText = (key: string, text: string) => {
    setResponses((prev) => ({ ...prev, [key]: { ...prev[key], text } }));
    setSaved(false);
  };

  const updateActivityTag = (key: string, activityId: string) => {
    setResponses((prev) => ({ ...prev, [key]: { ...prev[key], activity_id: activityId } }));
    setSaved(false);
  };

  const handleSave = () => {
    // Drop empty responses so we don't persist blank entries.
    const cleaned = Object.fromEntries(
      Object.entries(responses).filter(([, v]) => v.text && v.text.trim().length > 0)
    );
    startTransition(async () => {
      await saveEveningReflection({ entryDate, responses: cleaned });
      setSaved(true);
    });
  };

  if (textMetrics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active text-based metrics to reflect on today — add some in Settings.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {textMetrics.map((metric) => {
        const key = metricKey(metric.metric_id, metric.custom_metric_id);
        const response = responses[key] ?? { text: "" };
        return (
          <div key={key} className="space-y-2 rounded-lg border p-3">
            <Label className="text-sm font-medium">{metric.name}</Label>
            {metric.description && (
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            )}
            <Textarea
              value={response.text}
              onChange={(e) => updateText(key, e.target.value)}
              placeholder="Write as much or as little as feels honest…"
              className="min-h-[90px]"
            />
            {activities.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Tag to an activity (optional):</span>
                <Select
                  value={response.activity_id}
                  onValueChange={(v) => updateActivityTag(key, v)}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      })}

      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {saved && !isPending && <Check className="mr-2 h-4 w-4" />}
        {saved ? "Saved" : "Save reflection"}
      </Button>
    </div>
  );
}
