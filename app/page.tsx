import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(await getPostAuthRedirect(supabase, user.id));
  }

  return (
    <main className="ruled-paper flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Process Journal</p>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Make the pattern visible.
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          A structured notebook for the psychological patterns that block progress — logged in
          plain numbers, not vibes.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/login">Sign in</Link>
      </Button>
    </main>
  );
}
