"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { LevelUpTask } from "@/types/level-up";

interface PendingTaskCardProps {
  task: LevelUpTask;
}

export function PendingTaskCard({ task }: PendingTaskCardProps) {
  const router = useRouter();
  const [submissionText, setSubmissionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // status === 'submitted' means the submission row was saved but the
  // evaluate-task call either hasn't run yet or failed partway — give
  // the person a way back in rather than a permanently stuck task.
  const isAwaitingEvaluation = task.status === "submitted";

  async function callEvaluate(submissionId: string) {
    const supabase = createClient();
    const { data: evalData, error: invokeError } = await supabase.functions.invoke(
      "evaluate-task",
      { body: { submissionId } }
    );
    if (invokeError) throw invokeError;
    if (evalData?.error) throw new Error(evalData.error);
  }

  async function handleSubmit() {
    if (!submissionText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: submission, error: insertError } = await supabase
        .from("level_up_submissions")
        .insert({
          task_id: task.id,
          user_id: user.id,
          submission_text: submissionText.trim(),
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      const { error: statusError } = await supabase
        .from("level_up_tasks")
        .update({ status: "submitted" })
        .eq("id", task.id)
        .eq("user_id", user.id);
      if (statusError) throw statusError;

      await callEvaluate(submission.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetryEvaluation() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: submission, error: fetchError } = await supabase
        .from("level_up_submissions")
        .select("id")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (fetchError) throw fetchError;

      await callEvaluate(submission.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get feedback. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{task.task_text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAwaitingEvaluation ? (
          <>
            <p className="text-sm text-muted-foreground">
              Submitted — waiting on feedback.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleRetryEvaluation}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get feedback"}
            </Button>
          </>
        ) : (
          <>
            <Textarea
              placeholder="What did you do / what happened?"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={4}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleSubmit}
              disabled={loading || !submissionText.trim()}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}