"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, BookOpen, Sparkles, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { QuickLogFab } from "@/components/logging/quick-log-fab";
import type { Activity, ActiveUserMetric } from "@/types/logging";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/quick-log", label: "Log", icon: Zap },
  { href: "/history", label: "History", icon: BookOpen },
  { href: "/level-up", label: "Level Up", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

interface AppShellProps {
  children: React.ReactNode;
  activities: Activity[];
  metrics: ActiveUserMetric[];
  initialActivityId: string | null;
}

export function AppShell({ children, activities, metrics, initialActivityId }: AppShellProps) {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const onQuickLogPage = pathname.startsWith("/quick-log");

  return (
    <div className="ruled-paper flex min-h-screen flex-col md:flex-row">
      {/* Desktop rail */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card/60 md:flex md:flex-col">
        <div className="px-5 pt-6 pb-4">
          <p className="font-serif text-lg font-semibold leading-tight">Process Journal</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Notebook, not a hype dashboard.</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="truncate px-2 text-xs text-muted-foreground">{user?.email}</p>
          <button
            type="button"
            onClick={() => signOut()}
            disabled={loading}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loading ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 md:hidden">
        <p className="font-serif text-base font-semibold">Process Journal</p>
        <button
          type="button"
          onClick={() => signOut()}
          disabled={loading}
          aria-label="Sign out"
          className="text-muted-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {!onQuickLogPage && (
        <QuickLogFab
          activities={activities}
          metrics={metrics}
          initialActivityId={initialActivityId}
        />
      )}

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => (
          <MobileTab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function MobileTab({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", active && "fill-accent")} strokeWidth={active ? 2.25 : 2} />
      {item.label}
    </Link>
  );
}
