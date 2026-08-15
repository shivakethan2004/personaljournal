"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Activity } from "@/types/logging";

interface ActivitySelectorProps {
  activities: Activity[];
  value: string | null;
  onChange: (activityId: string) => void;
}

/**
 * Kept intentionally dumb and fast — this is used mid-task, so it's a
 * single native-feeling select, not a multi-step picker. Defaulting to
 * the most-recently-used activity happens where this is instantiated
 * (the parent passes the initial `value`).
 */
export function ActivitySelector({ activities, value, onChange }: ActivitySelectorProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No active activities yet.</p>;
  }

  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Which activity?" />
      </SelectTrigger>
      <SelectContent>
        {activities.map((activity) => (
          <SelectItem key={activity.id} value={activity.id}>
            {activity.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
