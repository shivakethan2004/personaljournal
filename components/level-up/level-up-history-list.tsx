import { Card, CardContent } from "@/components/ui/card";
import type { LevelUpSubmissionWithTask } from "@/types/level-up";

interface LevelUpHistoryListProps {
  items: LevelUpSubmissionWithTask[];
}

export function LevelUpHistoryList({ items }: LevelUpHistoryListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="space-y-1 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{item.level_up_tasks?.task_text ?? "Task"}</p>
              {item.points_awarded !== null && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.points_awarded} pts
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{item.submission_text}</p>
            {item.ai_feedback && <p className="text-sm">{item.ai_feedback}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}