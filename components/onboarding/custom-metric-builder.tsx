"use client";

import { useState } from "react";
import type { CustomMetricDraft, InputType } from "@/types/domain";

const INPUT_TYPES: { value: InputType; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
  { value: "timer", label: "Timer" },
  { value: "tally", label: "Tally" },
];

export function CustomMetricBuilderStep({
  customMetrics,
  onAdd,
  onRemove,
  onNext,
  onBack,
}: {
  customMetrics: CustomMetricDraft[];
  onAdd: (draft: CustomMetricDraft) => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inputType, setInputType] = useState<InputType>("number");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), description: description.trim(), input_type: inputType });
    setName("");
    setDescription("");
    setInputType("number");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Add a custom metric</h2>
        <p className="text-muted-foreground text-sm">
          Optional — if the library doesn't cover something you want to
          track, define it here. You can skip this.
        </p>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Metric name"
          className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          {INPUT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setInputType(t.value)}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                inputType === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="border-input rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          + Add metric
        </button>
      </div>

      {customMetrics.length > 0 && (
        <ul className="space-y-2">
          {customMetrics.map((m, i) => (
            <li
              key={i}
              className="flex items-start justify-between rounded-md bg-muted p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {m.name}
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    {m.input_type}
                  </span>
                </p>
                {m.description && (
                  <p className="text-muted-foreground text-xs">{m.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground text-xs underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
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
          Next: activities
        </button>
      </div>
    </div>
  );
}