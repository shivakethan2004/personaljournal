import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { activityChipStyle, activityDotStyle } from "@/lib/logging/activity-color";
import type { Activity } from "@/types/logging";
import type { HistoryDay } from "@/lib/logging/history";

function formatDateHeading(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatRecovery(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
}

function ActivityChip({ activity }: { activity: Activity }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={activityChipStyle(activity.id)}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={activityDotStyle(activity.id)} />
      {activity.name}
    </span>
  );
}

export function HistoryDayCard({ day }: { day: HistoryDay }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base font-semibold">{formatDateHeading(day.date)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {day.plans.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Morning plan
            </h3>
            <ul className="space-y-1.5">
              {day.plans.map((plan) => (
                <li key={plan.id} className="flex items-start gap-2 text-sm">
                  <ActivityChip activity={plan.activity} />
                  <span className="flex-1">
                    {plan.objective_text || <em className="text-muted-foreground">No objective set</em>}
                  </span>
                  {plan.motivation !== null && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      motivation {plan.motivation}/10
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {day.logs.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick logs
            </h3>
            <ul className="space-y-1.5">
              {day.logs.map((log) => (
                <li key={log.id} className="flex items-start gap-2 text-sm">
                  <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatTime(log.timestamp)}
                  </span>
                  <ActivityChip activity={log.activity} />
                  <span className="flex-1">
                    {log.tag === "setback" && (
                      <Badge variant="destructive" className="mr-1.5 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Setback
                      </Badge>
                    )}
                    {log.metric && <span className="font-medium">{log.metric.name}: </span>}
                    {log.value !== null && <span>{log.value}</span>}
                    {log.content && <span>{log.content}</span>}
                    {!log.metric && log.value === null && !log.content && log.tag !== "setback" && (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {log.recoverySeconds !== null && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (recovered in {formatRecovery(log.recoverySeconds)})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {day.reflection && (
          <section className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evening reflection
            </h3>
            <ul className="space-y-2">
              {day.reflection.entries.map((entry, idx) => (
                <li key={idx} className="text-sm">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-medium">{entry.metric.name}</span>
                    {entry.activity && <ActivityChip activity={entry.activity} />}
                  </div>
                  <p className="text-muted-foreground">{entry.text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {day.plans.length === 0 && day.logs.length === 0 && !day.reflection && (
          <p className="text-sm text-muted-foreground">Nothing matches the current filters for this day.</p>
        )}
      </CardContent>
    </Card>
  );
}
