import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "Process Journal",
  description: "A journaling app that adapts to your patterns and domains.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}