"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Activity } from "@/types/logging";

interface GenerateTaskCardProps {
  activities: Activity[];
}

const GENERAL_VALUE = "general";

export function GenerateTaskCard({ activities }: GenerateTaskCardProps) {
  const router = useRouter();
  const [activityId, setActivityId] = useState<string>(GENERAL_VALUE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: invokeError } = await supabase.functions.invoke("generate-task", {
        body: { activityId: activityId === GENERAL_VALUE ? null : activityId },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate a task. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Give me a task</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={activityId} onValueChange={setActivityId}>
          <SelectTrigger>
            <SelectValue placeholder="Pick an activity (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GENERAL_VALUE}>General — not tied to one activity</SelectItem>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Give me a task"}
        </Button>
      </CardContent>
    </Card>
  );
}