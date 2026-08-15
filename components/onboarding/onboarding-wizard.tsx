"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ActivityDraft,
  CustomMetricDraft,
  LibraryMetric,
  ProblemPattern,
} from "@/types/domain";
import { scoreQuiz } from "@/lib/onboarding/quiz-data";
import { completeOnboarding } from "@/app/onboarding/actions";
import { QuizStep } from "./quiz-step";
import { ResultsStep } from "./results-step";
import { CustomizeStep } from "./customize-step";
import { CustomMetricBuilderStep } from "./custom-metric-builder";
import { ActivitiesStep } from "./activities-step";

type Step = "quiz" | "results" | "customize" | "custom-metrics" | "activities";

const STEP_ORDER: Step[] = [
  "quiz",
  "results",
  "customize",
  "custom-metrics",
  "activities",
];

export function OnboardingWizard({
  patterns,
  metrics,
}: {
  patterns: ProblemPattern[];
  metrics: LibraryMetric[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("quiz");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [selectedMetricIds, setSelectedMetricIds] = useState<Set<string>>(
    new Set()
  );
  const [customMetrics, setCustomMetrics] = useState<CustomMetricDraft[]>([]);
  const [activities, setActivities] = useState<ActivityDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const matches = useMemo(
    () => scoreQuiz(quizAnswers, patterns),
    [quizAnswers, patterns]
  );
  const matchedPatternIds = useMemo(
    () => matches.slice(0, 5).map((m) => m.pattern.id),
    [matches]
  );

  // Once results are computed, pre-select the suggested metrics unless the
  // user has already started customizing.
  const goToCustomize = () => {
    setSelectedMetricIds((prev) => {
      if (prev.size > 0) return prev;
      const suggested = metrics.filter(
        (m) =>
          m.problem_pattern_id && matchedPatternIds.includes(m.problem_pattern_id)
      );
      return new Set(suggested.map((m) => m.id));
    });
    setStep("customize");
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetricIds((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) next.delete(metricId);
      else next.add(metricId);
      return next;
    });
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setSubmitError(undefined);

    const result = await completeOnboarding({
      quizAnswers,
      matchedPatternIds,
      selectedLibraryMetricIds: Array.from(selectedMetricIds),
      customMetrics,
      activities,
    });

    if (result.ok) {
      router.push("/dashboard");
    } else {
      setSubmitError(result.error);
      setSubmitting(false);
    }
  };

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <ProgressBar current={stepIndex} total={STEP_ORDER.length} />

      {step === "quiz" && (
        <QuizStep
          answers={quizAnswers}
          onAnswer={(id, score) =>
            setQuizAnswers((prev) => ({ ...prev, [id]: score }))
          }
          onNext={() => setStep("results")}
        />
      )}

      {step === "results" && (
        <ResultsStep
          matches={matches}
          metrics={metrics}
          onNext={goToCustomize}
          onBack={() => setStep("quiz")}
        />
      )}

      {step === "customize" && (
        <CustomizeStep
          matchedPatternIds={matchedPatternIds}
          metrics={metrics}
          patterns={patterns}
          selectedMetricIds={selectedMetricIds}
          onToggleMetric={toggleMetric}
          onNext={() => setStep("custom-metrics")}
          onBack={() => setStep("results")}
        />
      )}

      {step === "custom-metrics" && (
        <CustomMetricBuilderStep
          customMetrics={customMetrics}
          onAdd={(draft) => setCustomMetrics((prev) => [...prev, draft])}
          onRemove={(i) =>
            setCustomMetrics((prev) => prev.filter((_, idx) => idx !== i))
          }
          onNext={() => setStep("activities")}
          onBack={() => setStep("customize")}
        />
      )}

      {step === "activities" && (
        <ActivitiesStep
          activities={activities}
          onChange={setActivities}
          onFinish={handleFinish}
          onBack={() => setStep("custom-metrics")}
          submitting={submitting}
          error={submitError}
        />
      )}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${
            i <= current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}