"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ok" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const supabase = createClient();
      // A cheap call that just confirms the client is wired up —
      // it doesn't require any tables to exist yet.
      supabase.auth.getSession().then(({ error }) => {
        if (error) {
          setStatus("error");
          setMessage(error.message);
        } else {
          setStatus("ok");
        }
      });
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Process Journal</h1>
      <p className="text-muted-foreground text-sm">Phase 1 — scaffold</p>

      <div className="rounded-md border px-4 py-3 text-sm">
        {status === "checking" && "Checking Supabase client…"}
        {status === "ok" && (
          <span className="text-green-600">
            ✓ Supabase client initialized without error
          </span>
        )}
        {status === "error" && (
          <span className="text-red-600">
            ✗ Supabase client error: {message}
            <br />
            <span className="text-muted-foreground">
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
              in .env.local
            </span>
          </span>
        )}
      </div>
    </main>
  );
}
