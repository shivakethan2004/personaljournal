"use client";

import { useState } from "react";
import type { ActivityDraft } from "@/types/domain";

const SUGGESTED_ACTIVITIES: ActivityDraft[] = [
  { name: "Cold calls", description: "" },
  { name: "Client meetings", description: "" },
  { name: "Content / Instagram", description: "" },
  { name: "Gym", description: "" },
];

export function ActivitiesStep({
  activities,
  onChange,
  onFinish,
  onBack,
  submitting,
  error,
}: {
  activities: ActivityDraft[];
  onChange: (activities: ActivityDraft[]) => void;
  onFinish: () => void;
  onBack: () => void;
  submitting: boolean;
  error?: string;
}) {
  const [customName, setCustomName] = useState("");

  const isSelected = (name: string) =>
    activities.some((a) => a.name === name);

  const toggleSuggested = (draft: ActivityDraft) => {
    if (isSelected(draft.name)) {
      onChange(activities.filter((a) => a.name !== draft.name));
    } else {
      onChange([...activities, draft]);
    }
  };

  const addCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed || isSelected(trimmed)) return;
    onChange([...activities, { name: trimmed, description: "" }]);
    setCustomName("");
  };

  const remove = (name: string) => {
    onChange(activities.filter((a) => a.name !== name));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">What are you tracking?</h2>
        <p className="text-muted-foreground text-sm">
          Define the domains of your life you want logs to belong to — cold
          calls, gym, a side project, whatever's real for you. At least one
          is required.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_ACTIVITIES.map((a) => (
          <button
            key={a.name}
            type="button"
            onClick={() => toggleSuggested(a)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              isSelected(a.name)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own activity"
          className="border-input flex-1 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customName.trim()}
          className="border-input rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {activities.length > 0 && (
        <ul className="space-y-1">
          {activities.map((a) => (
            <li
              key={a.name}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
            >
              {a.name}
              <button
                type="button"
                onClick={() => remove(a.name)}
                className="text-muted-foreground text-xs underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

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
          onClick={onFinish}
          disabled={activities.length === 0 || submitting}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {submitting ? "Saving…" : "Finish onboarding"}
        </button>
      </div>
    </div>
  );
}