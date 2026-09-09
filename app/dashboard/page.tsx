import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DashboardNav from "@/components/DashboardNav";
import { Flame, Mail, ChevronLeft, ChevronRight } from "lucide-react";

type Filter = "new" | "hot" | "all";

const TABS: [Filter, string][] = [
  ["all", "All leads"],
  ["new", "New"],
  ["hot", "Hot"],
];

const PAGE_SIZE = 10;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { filter: rawFilter, page: rawPage } = await searchParams;
  const filter: Filter =
    rawFilter === "new" || rawFilter === "hot" ? rawFilter : "all";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const supabase = await createClient();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("leads")
    .select(
      "id, name, email, interest_note, lead_score, lead_category, status, created_at",
      {
        count: "exact",
      },
    )
    // Newest submissions first — a scored-but-old lead no longer buries a
    // brand new one that just hasn't been scored yet.
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filter === "new") query = query.eq("status", "New");
  if (filter === "hot") query = query.eq("lead_category", "Hot");

  const { data: leads, error, count } = await query;

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <DashboardNav />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-2xl text-[var(--color-ink)]">
              Leads
            </h1>
            {count != null && (
              <p className="text-sm text-[var(--color-muted)]">{count} total</p>
            )}
          </div>

          <nav className="mt-5 inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white p-1">
            {TABS.map(([key, label]) => (
              <Link
                key={key}
                href={`/dashboard?filter=${key}`}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-[var(--color-lapis)] text-white"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {error && (
            <p className="mt-4 text-sm text-[var(--color-rust)]">
              Couldn&apos;t load leads: {error.message}
            </p>
          )}

          <div className="mt-4 divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
            {leads?.length === 0 && (
              <p className="p-6 text-sm text-[var(--color-muted)]">
                No leads in this view yet.
              </p>
            )}
            {leads?.map((lead) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-[var(--color-paper)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-lapis)]/10 text-sm font-medium text-[var(--color-lapis)]">
                    {initials(lead.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--color-ink)]">
                      {lead.name}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-sm text-[var(--color-muted)]">
                      <Mail
                        className="h-3.5 w-3.5 shrink-0"
                        strokeWidth={1.75}
                      />
                      {lead.email}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="hidden text-xs text-[var(--color-muted)] sm:block">
                    {timeAgo(lead.created_at)}
                  </span>
                  <span className="text-sm text-[var(--color-muted)]">
                    {lead.status}
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      lead.lead_category === "Hot"
                        ? "bg-[var(--color-rust)]/10 text-[var(--color-rust)]"
                        : lead.lead_category === "Warm"
                          ? "bg-[var(--color-gold)]/15 text-[var(--color-gold)]"
                          : "bg-[var(--color-border)] text-[var(--color-muted)]"
                    }`}
                  >
                    {lead.lead_category === "Hot" && (
                      <Flame className="h-3 w-3" strokeWidth={2} />
                    )}
                    {lead.lead_category ?? "Unscored"}
                    {lead.lead_score != null ? ` · ${lead.lead_score}` : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              {page > 1 ? (
                <Link
                  href={`/dashboard?filter=${filter}&page=${page - 1}`}
                  className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-lapis)] hover:text-[var(--color-lapis)]"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                  Previous
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] opacity-40">
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                  Previous
                </span>
              )}

              <p className="text-sm text-[var(--color-muted)]">
                Page {page} of {totalPages}
              </p>

              {page < totalPages ? (
                <Link
                  href={`/dashboard?filter=${filter}&page=${page + 1}`}
                  className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-lapis)] hover:text-[var(--color-lapis)]"
                >
                  Next
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] opacity-40">
                  Next
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
