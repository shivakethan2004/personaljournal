"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Activity, ActiveUserMetric } from "@/types/logging";
import { metricKey } from "@/lib/logging/metric-key";

interface HistoryFiltersProps {
  activities: Activity[];
  metrics: ActiveUserMetric[];
}

const ALL = "all";

/**
 * Filters are encoded in the URL (range/activity/metric search params) so
 * the page stays a server component that fetches exactly what's needed —
 * no client-side refetch layer, and filtered views are shareable/bookmarkable.
 */
export function HistoryFilters({ activities, metrics }: HistoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const range = searchParams.get("range") ?? "30";
  const activity = searchParams.get("activity") ?? ALL;
  const metric = searchParams.get("metric") ?? ALL;

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs value={range} onValueChange={(v) => setParam("range", v)}>
        <TabsList>
          <TabsTrigger value="7">7 days</TabsTrigger>
          <TabsTrigger value="30">30 days</TabsTrigger>
          <TabsTrigger value="all">All time</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={activity} onValueChange={(v) => setParam("activity", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All activities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All activities</SelectItem>
          {activities.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={metric} onValueChange={(v) => setParam("metric", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All metrics" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All metrics</SelectItem>
          {metrics.map((m) => (
            <SelectItem key={metricKey(m.metric_id, m.custom_metric_id)} value={metricKey(m.metric_id, m.custom_metric_id)}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
