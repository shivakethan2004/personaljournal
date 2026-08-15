"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Zap } from "lucide-react";
import { QuickLogWidget } from "./quick-log-widget";
import type { Activity, ActiveUserMetric } from "@/types/logging";

interface QuickLogFabProps {
  activities: Activity[];
  metrics: ActiveUserMetric[];
  initialActivityId: string | null;
}

/**
 * Mount this once in the authenticated layout (e.g. app/(dashboard)/layout.tsx
 * or directly in app/layout.tsx alongside AuthProvider) so quick-log is
 * always one tap away, per the build plan's "always-accessible" requirement.
 * Pass it the same activities/metrics data you'd fetch for the dashboard —
 * no need to fetch twice if the parent layout already has it.
 */
export function QuickLogFab({ activities, metrics, initialActivityId }: QuickLogFabProps) {
  const [open, setOpen] = useState(false);

  if (activities.length === 0) return null; // nothing to log yet

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg"
        aria-label="Quick log"
      >
        <Zap className="h-6 w-6" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto sm:max-w-md sm:mx-auto sm:rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Quick log</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <QuickLogWidget
              activities={activities}
              metrics={metrics}
              initialActivityId={initialActivityId}
              onLogged={() => {
                /* keep sheet open — user may want to log more than one thing */
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
