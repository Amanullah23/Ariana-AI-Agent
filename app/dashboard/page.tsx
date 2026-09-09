import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { signOut } from "../login/actions";

type Filter = "new" | "hot" | "all";

const TABS: [Filter, string][] = [
  ["all", "All leads"],
  ["new", "New"],
  ["hot", "Hot"],
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: Filter =
    rawFilter === "new" || rawFilter === "hot" ? rawFilter : "all";

  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(
      "id, name, email, interest_note, lead_score, lead_category, status, created_at",
    )
    .order("lead_score", { ascending: false, nullsFirst: false });

  if (filter === "new") query = query.eq("status", "New");
  if (filter === "hot") query = query.eq("lead_category", "Hot");

  const { data: leads, error } = await query;

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-[#1C1A17]">Leads</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/trends"
              className="text-sm text-[#5B554B] underline"
            >
              Trend discovery
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-[#5B554B] underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav className="mt-6 flex gap-2 border-b border-[#E4D9C8]">
          {TABS.map(([key, label]) => (
            <Link
              key={key}
              href={`/dashboard?filter=${key}`}
              className={`px-3 py-2 text-sm ${
                filter === key
                  ? "border-b-2 border-[#B5541F] text-[#1C1A17]"
                  : "text-[#8A8272]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {error && (
          <p className="mt-4 text-sm text-[#B5541F]">
            Couldn&apos;t load leads: {error.message}
          </p>
        )}

        <div className="mt-4 divide-y divide-[#E4D9C8] rounded-md border border-[#E4D9C8] bg-white">
          {leads?.length === 0 && (
            <p className="p-6 text-sm text-[#8A8272]">
              No leads in this view yet.
            </p>
          )}
          {leads?.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="flex items-center justify-between p-4 hover:bg-[#FAF7F2]"
            >
              <div>
                <p className="text-[#1C1A17]">{lead.name}</p>
                <p className="text-sm text-[#8A8272]">{lead.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#5B554B]">{lead.status}</span>
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    lead.lead_category === "Hot"
                      ? "bg-[#F5D9C8] text-[#8A3E12]"
                      : lead.lead_category === "Warm"
                        ? "bg-[#F0E6C8] text-[#6B5A12]"
                        : "bg-[#E4D9C8] text-[#5B554B]"
                  }`}
                >
                  {lead.lead_category ?? "Unscored"}
                  {lead.lead_score != null ? ` · ${lead.lead_score}` : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
