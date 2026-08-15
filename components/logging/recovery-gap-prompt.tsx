"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { confirmRecoveryGap } from "@/app/quick-log/actions";

interface RecoveryGapPromptProps {
  confirmationId: string;
  gapSeconds: number;
  onDone: () => void;
}

function formatGap(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
}

/**
 * "This only fires on genuinely ambiguous gaps" — so it stays a single
 * yes/no question, no follow-up form, no explanation required.
 */
export function RecoveryGapPrompt({ confirmationId, gapSeconds, onDone }: RecoveryGapPromptProps) {
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const answer = (choice: "recovering" | "break") => {
    startTransition(async () => {
      await confirmRecoveryGap(confirmationId, choice);
      setOpen(false);
      onDone();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDone()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick check</DialogTitle>
          <DialogDescription>
            That gap was {formatGap(gapSeconds)} — longer than usual for this activity. Was that
            recovery time, or a break?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button variant="outline" disabled={isPending} onClick={() => answer("break")}>
            It was a break
          </Button>
          <Button disabled={isPending} onClick={() => answer("recovering")}>
            Still recovering
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
