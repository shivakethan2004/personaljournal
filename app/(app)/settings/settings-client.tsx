"use client";

import { useState, useTransition } from "react";
import type { InputType } from "@/types/domain";
import {
  setUserMetricActive,
  addLibraryMetric,
  addCustomMetric,
  setActivityActive,
  addActivity,
} from "./actions";

export type SettingsMetricRow = {
  userMetricId: string;
  name: string;
  inputType: InputType;
  active: boolean;
};

export type LibraryMetricOption = {
  id: string;
  name: string;
  inputType: InputType;
};

export type SettingsActivityRow = {
  id: string;
  name: string;
  active: boolean;
};

const INPUT_TYPES: InputType[] = ["number", "text", "timer", "tally"];

export function SettingsClient({
  trackedMetrics,
  availableLibraryMetrics,
  activities,
}: {
  trackedMetrics: SettingsMetricRow[];
  availableLibraryMetrics: LibraryMetricOption[];
  activities: SettingsActivityRow[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10 p-6">
      <div>
        <h1 className="font-serif text-xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage which metrics and activities are active.
        </p>
      </div>

      <MetricsSection
        trackedMetrics={trackedMetrics}
        availableLibraryMetrics={availableLibraryMetrics}
        pending={pending}
        startTransition={startTransition}
      />

      <ActivitiesSection
        activities={activities}
        pending={pending}
        startTransition={startTransition}
      />
    </div>
  );
}

function MetricsSection({
  trackedMetrics,
  availableLibraryMetrics,
  pending,
  startTransition,
}: {
  trackedMetrics: SettingsMetricRow[];
  availableLibraryMetrics: LibraryMetricOption[];
  pending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inputType, setInputType] = useState<InputType>("number");
  const [libraryPick, setLibraryPick] = useState("");

  const submitCustom = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await addCustomMetric({ name: name.trim(), description, input_type: inputType });
      setName("");
      setDescription("");
      setInputType("number");
      setAddingCustom(false);
    });
  };

  const submitLibraryPick = () => {
    if (!libraryPick) return;
    startTransition(async () => {
      await addLibraryMetric(libraryPick);
      setLibraryPick("");
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Metrics</h2>

      <ul className="space-y-2">
        {trackedMetrics.map((m) => (
          <li
            key={m.userMetricId}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-muted-foreground text-xs">{m.inputType}</p>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={m.active}
                disabled={pending}
                onChange={(e) =>
                  startTransition(async () => {
                    await setUserMetricActive(m.userMetricId, e.target.checked);
                  })
                }
              />
              Active
            </label>
          </li>
        ))}
        {trackedMetrics.length === 0 && (
          <p className="text-muted-foreground text-sm">No metrics yet.</p>
        )}
      </ul>

      {availableLibraryMetrics.length > 0 && (
        <div className="flex gap-2">
          <select
            value={libraryPick}
            onChange={(e) => setLibraryPick(e.target.value)}
            className="border-input flex-1 rounded-md border bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Add from library…</option>
            {availableLibraryMetrics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.inputType})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={submitLibraryPick}
            disabled={!libraryPick || pending}
            className="border-input rounded-md border px-3 py-2 text-sm disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      {!addingCustom ? (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          className="text-primary text-sm underline underline-offset-2"
        >
          + Define a custom metric
        </button>
      ) : (
        <div className="space-y-2 rounded-md border p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Metric name"
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            {INPUT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInputType(t)}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  inputType === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitCustom}
              disabled={!name.trim() || pending}
              className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setAddingCustom(false)}
              className="border-input rounded-md border px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ActivitiesSection({
  activities,
  pending,
  startTransition,
}: {
  activities: SettingsActivityRow[];
  pending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await addActivity({ name: name.trim(), description: "" });
      setName("");
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Activities</h2>

      <ul className="space-y-2">
        {activities.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <p className="text-sm font-medium">{a.name}</p>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={a.active}
                disabled={pending}
                onChange={(e) =>
                  startTransition(async () => {
                    await setActivityActive(a.id, e.target.checked);
                  })
                }
              />
              Active
            </label>
          </li>
        ))}
        {activities.length === 0 && (
          <p className="text-muted-foreground text-sm">No activities yet.</p>
        )}
      </ul>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="New activity name"
          className="border-input flex-1 rounded-md border bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || pending}
          className="border-input rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </section>
  );
}