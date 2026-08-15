"use client";

import { useAuth } from "@/contexts/auth-context";

export function DashboardContent() {
  const { user, signOut, loading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="text-lg">
        Logged in as <span className="font-medium">{user?.email}</span>
      </p>
      <button
        type="button"
        onClick={() => signOut()}
        disabled={loading}
        className="border-input rounded-md border px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Logging out…" : "Log out"}
      </button>
    </main>
  );
}