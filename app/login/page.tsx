"use client";

import { useActionState, useState } from "react";
import { signInWithPassword, signUpWithPassword, type AuthFormState } from "./actions";

const initialState: AuthFormState = { status: "idle" };

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [signInState, signInAction, signInPending] = useActionState(
    signInWithPassword,
    initialState
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUpWithPassword,
    initialState
  );

  const state = mode === "signin" ? signInState : signUpState;
  const pending = mode === "signin" ? signInPending : signUpPending;
  const action = mode === "signin" ? signInAction : signUpAction;

  return (
    <main className="ruled-paper flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-serif text-2xl font-semibold">Process Journal</h1>
          <p className="text-muted-foreground text-sm">
            {mode === "signin"
              ? "Sign in to your account."
              : "Create an account to get started."}
          </p>
        </div>

        <div className="flex rounded-md border p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-sm py-1.5 transition-colors ${
              mode === "signin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-sm py-1.5 transition-colors ${
              mode === "signup"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Sign up
          </button>
        </div>

        <form key={mode} action={action} className="space-y-3">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="Password"
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-primary-foreground w-full rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {pending
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {state.status === "error" && (
          <p className="text-center text-sm text-flag">{state.message}</p>
        )}
      </div>
    </main>
  );
}