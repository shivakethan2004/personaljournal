import { createClient } from "@/lib/supabase/server";
import { getHistoryDays, type HistoryFilters as HistoryFiltersType } from "@/lib/logging/history";
import { HistoryFilters } from "@/components/logging/history-filters";
import { HistoryDayCard } from "@/components/logging/history-day-card";
import { BookOpen } from "lucide-react";
import { WeeklySummaryCard } from "@/components/history/weekly-summary-card"
interface HistoryPageProps {
  searchParams: Promise<{ range?: string; activity?: string; metric?: string }>;
}

function parseRange(range: string | undefined): 7 | 30 | null {
  if (range === "7") return 7;
  if (range === "all") return null;
  return 30; // default
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const filters: HistoryFiltersType = {
    rangeDays: parseRange(params.range),
    activityId: params.activity ?? null,
    metricKey: params.metric ?? null,
  };

  const { days, activities, metrics, isEmpty } = await getHistoryDays(user.id, filters);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">History</h1>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <WeeklySummaryCard />
          <HistoryFilters activities={activities} metrics={metrics} />
          {days.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing matches these filters. Try widening the date range or clearing a filter.
            </p>
          ) : (
            <div className="space-y-4">
              {days.map((day) => (
                <HistoryDayCard key={day.date} day={day} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <BookOpen className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="font-medium">No entries yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Once you log a morning plan, a quick log, or an evening reflection, it'll show up here.
        </p>
      </div>
    </div>
  );
}
