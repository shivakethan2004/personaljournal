"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/post-auth-redirect";

export type AuthFormState = {
  status: "idle" | "error";
  message?: string;
};

export async function signUpWithPassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { status: "error", message: "Enter an email and password." };
  }
  if (password.length < 6) {
    return { status: "error", message: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!data.session || !data.user) {
    // Supabase only hands back a session immediately when email
    // confirmation is turned OFF for the project. If you land here, the
    // account was created but is stuck waiting on a confirmation email —
    // go to Supabase Dashboard > Authentication > Sign In / Providers >
    // Email and turn off "Confirm email", then try again.
    return {
      status: "error",
      message:
        'Account created, but no session came back — your Supabase project still requires email confirmation. Turn off "Confirm email" under Authentication > Providers > Email, then sign up again.',
    };
  }

  const target = await getPostAuthRedirect(supabase, data.user.id);
  redirect(target);
}

export async function signInWithPassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { status: "error", message: "Enter an email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const target = await getPostAuthRedirect(supabase, data.user.id);
  redirect(target);
}