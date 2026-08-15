import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles, Zap, Moon } from "lucide-react";
import { activityDotStyle } from "@/lib/logging/activity-color";
import type { Activity, DailyPlan } from "@/types/logging";

interface TodayContentProps {
  entryDate: string;
  activities: Activity[];
  plans: DailyPlan[];
  hasReflection: boolean;
  quickLogCount: number;
  points: number;
}

function formatHeading(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function TodayContent({
  entryDate,
  activities,
  plans,
  hasReflection,
  quickLogCount,
  points,
}: TodayContentProps) {
  const planByActivity = new Map(plans.map((p) => [p.activity_id, p]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Today&apos;s entry</p>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          {formatHeading(entryDate)}
        </h1>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No activities set up yet.{" "}
            <Link href="/settings" className="text-primary underline underline-offset-4">
              Add one in Settings
            </Link>{" "}
            to start planning your day.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Morning plan
              <Link href="/morning" className="text-xs font-normal text-primary underline underline-offset-4">
                {plans.length > 0 ? "Edit" : "Fill in"}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activities.map((activity) => {
              const plan = planByActivity.get(activity.id);
              const filled = !!plan?.objective_text || plan?.motivation != null;
              return (
                <div key={activity.id} className="flex items-start gap-2.5 text-sm">
                  {filled ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={activityDotStyle(activity.id)}
                      />
                      {activity.name}
                    </span>
                    {filled ? (
                      <p className="truncate text-muted-foreground">
                        {plan?.objective_text || "No objective — motivation logged only"}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No plan yet</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/quick-log">
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardContent className="flex items-center gap-3 py-2">
              <Zap className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Quick log</p>
                <p className="tabular-figures text-sm text-muted-foreground">
                  {quickLogCount} {quickLogCount === 1 ? "entry" : "entries"} today
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/evening">
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardContent className="flex items-center gap-3 py-2">
              <Moon className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Evening reflection</p>
                <p className="text-sm text-muted-foreground">
                  {hasReflection ? "Done" : "Not started"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Level Up total</span>
          <span className="tabular-figures font-medium text-foreground">{points} pts</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/level-up">Open</Link>
        </Button>
      </div>
    </div>
  );
}
