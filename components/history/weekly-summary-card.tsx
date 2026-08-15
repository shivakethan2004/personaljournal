"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklySummaryResult {
  id: string;
  week_start: string;
  summary_text: string;
  created_at: string;
}

/**
 * Triggers the "weekly-summary" Edge Function and renders the result.
 * supabase.functions.invoke() forwards the current session's JWT
 * automatically, which is what the function uses for its RLS-scoped
 * client — no manual header wiring needed here.
 */
export function WeeklySummaryCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WeeklySummaryResult | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: invokeError } = await supabase.functions.invoke("weekly-summary", {
        method: "POST",
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary as WeeklySummaryResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong generating the summary."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-medium">This week</CardTitle>
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "This week"}
        </Button>
      </CardHeader>
      {(summary || error) && (
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {summary && (
            <div className="space-y-1">
              <p className="text-sm leading-relaxed">{summary.summary_text}</p>
              <p className="text-xs text-muted-foreground">Week of {summary.week_start}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}