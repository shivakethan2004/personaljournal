"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Play, Pause, RotateCcw } from "lucide-react";
import type { ActiveUserMetric } from "@/types/logging";

export interface MetricInputValue {
  value: number | null;
  content: string | null;
}

interface MetricInputProps {
  metric: ActiveUserMetric;
  value: MetricInputValue;
  onChange: (next: MetricInputValue) => void;
}

/**
 * One row per active metric. Renders a number stepper, tally counter,
 * timer, or short text box depending on metric.input_type. Left blank
 * (value stays null/empty) means "not logging this metric right now" —
 * quick-log only submits metrics the user actually touched.
 */
export function MetricInput({ metric, value, onChange }: MetricInputProps) {
  return (
    <div className="space-y-1.5 rounded-lg border p-3">
      <Label className="text-sm font-medium">{metric.name}</Label>
      {metric.description && (
        <p className="text-xs text-muted-foreground">{metric.description}</p>
      )}
      <div className="pt-1">
        {metric.input_type === "number" && (
          <NumberInput value={value.value} onChange={(v) => onChange({ value: v, content: null })} />
        )}
        {metric.input_type === "tally" && (
          <TallyInput value={value.value} onChange={(v) => onChange({ value: v, content: null })} />
        )}
        {metric.input_type === "timer" && (
          <TimerInput
            value={value.value}
            onChange={(v) => onChange({ value: v, content: null })}
          />
        )}
        {metric.input_type === "text" && (
          <Textarea
            placeholder="Optional note…"
            value={value.content ?? ""}
            onChange={(e) => onChange({ value: null, content: e.target.value || null })}
            className="min-h-[70px]"
          />
        )}
      </div>
    </div>
  );
}

function NumberInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange((value ?? 0) - 1)}
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="w-20 text-center tabular-figures"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange((value ?? 0) + 1)}
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TallyInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const count = value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        size="lg"
        className="h-14 w-14 rounded-full text-lg font-semibold"
        onClick={() => onChange(count + 1)}
      >
        +1
      </Button>
      <span className="tabular-figures text-2xl font-semibold">{count}</span>
      {count > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Reset
        </Button>
      )}
    </div>
  );
}

function TimerInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(value ?? 0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed * 1000;
    const tick = () => {
      if (startRef.current !== null) {
        const next = Math.round((Date.now() - startRef.current) / 1000);
        setElapsed(next);
        onChange(next);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="flex items-center gap-3">
      <span className="tabular-figures w-16 text-xl font-semibold">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      <Button
        type="button"
        variant={running ? "secondary" : "default"}
        size="icon"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "Pause" : "Start"}
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => {
          setRunning(false);
          setElapsed(0);
          onChange(null);
        }}
        aria-label="Reset"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
