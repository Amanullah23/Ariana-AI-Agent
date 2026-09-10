"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutList,
  TrendingUp,
  Megaphone,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Leads", icon: LayoutList },
  { href: "/dashboard/trends", label: "Trend discovery", icon: TrendingUp },
  { href: "/dashboard/engagement", label: "Engagement", icon: Megaphone },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-lapis)] text-white">
            <Compass className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <span className="font-display text-base text-[var(--color-ink)]">
            Ariana Agent AI
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-lapis)]/10 text-[var(--color-lapis)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-rust)]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
