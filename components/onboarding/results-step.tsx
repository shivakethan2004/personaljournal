"use client";

import type { LibraryMetric, ProblemPattern } from "@/types/domain";

export function ResultsStep({
  matches,
  metrics,
  onNext,
  onBack,
}: {
  matches: { pattern: ProblemPattern; score: number }[];
  metrics: LibraryMetric[];
  onNext: () => void;
  onBack: () => void;
}) {
  const top = matches.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-lg font-semibold">Here&apos;s what stood out</h2>
        <p className="text-muted-foreground text-sm">
          Based on your answers, these patterns showed up most. Each comes
          with a metric you could track to work with it.
        </p>
      </div>

      <div className="space-y-4">
        {top.map(({ pattern }) => {
          const suggested = metrics.filter(
            (m) => m.problem_pattern_id === pattern.id
          );
          return (
            <div key={pattern.id} className="rounded-md border p-4">
              <h3 className="font-medium">{pattern.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {pattern.description}
              </p>
              {suggested.map((m) => (
                <div key={m.id} className="mt-3 rounded-md bg-muted p-3">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {m.why_it_helps}
                  </p>
                </div>
              ))}
            </div>
          );
        })}

        {top.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nothing scored strongly enough to surface — that&apos;s fine, you can
            still browse the full metric library on the next screen.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <button
          type="button"
          onClick={onBack}
          className="border-input rounded-md border px-4 py-2 text-sm"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Customize metrics
        </button>
      </div>
    </div>
  );
}