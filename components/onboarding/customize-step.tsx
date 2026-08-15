"use client";

import { useState } from "react";
import type { LibraryMetric, ProblemPattern } from "@/types/domain";

export function CustomizeStep({
  matchedPatternIds,
  metrics,
  patterns,
  selectedMetricIds,
  onToggleMetric,
  onNext,
  onBack,
}: {
  matchedPatternIds: string[];
  metrics: LibraryMetric[];
  patterns: ProblemPattern[];
  selectedMetricIds: Set<string>;
  onToggleMetric: (metricId: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const suggested = metrics.filter(
    (m) => m.problem_pattern_id && matchedPatternIds.includes(m.problem_pattern_id)
  );
  const rest = metrics.filter((m) => !suggested.includes(m));

  const patternName = (id: string | null) =>
    patterns.find((p) => p.id === id)?.name;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pick your metrics</h2>
        <p className="text-muted-foreground text-sm">
          These are suggested from your quiz results. Uncheck anything that
          doesn't fit, or browse the full library to add more.
        </p>
      </div>

      <div className="space-y-2">
        {suggested.map((m) => (
          <MetricRow
            key={m.id}
            metric={m}
            patternLabel={patternName(m.problem_pattern_id)}
            checked={selectedMetricIds.has(m.id)}
            onToggle={() => onToggleMetric(m.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowAll((s) => !s)}
        className="text-primary text-sm underline underline-offset-2"
      >
        {showAll ? "Hide full library" : "Browse full metric library"}
      </button>

      {showAll && (
        <div className="space-y-2 border-t pt-4">
          {rest.map((m) => (
            <MetricRow
              key={m.id}
              metric={m}
              patternLabel={patternName(m.problem_pattern_id)}
              checked={selectedMetricIds.has(m.id)}
              onToggle={() => onToggleMetric(m.id)}
            />
          ))}
        </div>
      )}

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
          Next: custom metrics
        </button>
      </div>
    </div>
  );
}

function MetricRow({
  metric,
  patternLabel,
  checked,
  onToggle,
}: {
  metric: LibraryMetric;
  patternLabel?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-1"
      />
      <div>
        <p className="text-sm font-medium">
          {metric.name}
          <span className="text-muted-foreground ml-2 text-xs font-normal">
            {metric.input_type}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">{metric.description}</p>
        {patternLabel && (
          <p className="text-muted-foreground mt-1 text-xs italic">
            For: {patternLabel}
          </p>
        )}
      </div>
    </label>
  );
}