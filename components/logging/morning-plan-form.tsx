"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { saveDailyPlan, clearDailyPlan } from "@/app/(app)/morning/actions";
import type { Activity, DailyPlan } from "@/types/logging";

interface MorningPlanFormProps {
  activities: Activity[];
  existingPlans: DailyPlan[];
  entryDate: string;
}

interface RowState {
  objectiveText: string;
  motivation: number;
  saved: boolean;
}

export function MorningPlanForm({ activities, existingPlans, entryDate }: MorningPlanFormProps) {
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const activity of activities) {
      const existing = existingPlans.find((p) => p.activity_id === activity.id);
      initial[activity.id] = {
        objectiveText: existing?.objective_text ?? "",
        motivation: existing?.motivation ?? 5,
        saved: !!existing,
      };
    }
    return initial;
  });

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityPlanRow
          key={activity.id}
          activity={activity}
          entryDate={entryDate}
          state={rows[activity.id]}
          onStateChange={(next) => setRows((prev) => ({ ...prev, [activity.id]: next }))}
        />
      ))}
      {activities.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No active activities yet — add some in Settings before planning your day.
        </p>
      )}
    </div>
  );
}

function ActivityPlanRow({
  activity,
  entryDate,
  state,
  onStateChange,
}: {
  activity: Activity;
  entryDate: string;
  state: RowState;
  onStateChange: (next: RowState) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      await saveDailyPlan({
        activityId: activity.id,
        entryDate,
        objectiveText: state.objectiveText.trim() || null,
        motivation: state.motivation,
      });
      onStateChange({ ...state, saved: true });
    });
  };

  const skip = () => {
    startTransition(async () => {
      await clearDailyPlan(activity.id, entryDate);
      onStateChange({ objectiveText: "", motivation: 5, saved: false });
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          {activity.name}
          {state.saved && <Check className="h-4 w-4 text-primary" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`objective-${activity.id}`}>Today&apos;s objective</Label>
          <Input
            id={`objective-${activity.id}`}
            placeholder="e.g. 30 cold calls, or leave blank to skip"
            value={state.objectiveText}
            onChange={(e) => onStateChange({ ...state, objectiveText: e.target.value, saved: false })}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Motivation</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{state.motivation}/10</span>
          </div>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[state.motivation]}
            onValueChange={([v]) => onStateChange({ ...state, motivation: v, saved: false })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={skip} disabled={isPending}>
            Skip today
          </Button>
          <Button size="sm" onClick={save} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
