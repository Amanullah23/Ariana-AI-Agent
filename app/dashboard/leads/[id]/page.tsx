import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, MessageSquare } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import { updateLeadStatus } from "./actions";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) notFound();

  return (
    <>
      <DashboardNav />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back to leads
          </Link>

          <h1 className="font-display mt-4 text-2xl text-[var(--color-ink)]">
            {lead.name}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">{lead.email}</p>

          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-6">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--color-muted)]">Stated interest</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.interest_note || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">AI score</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.lead_score ?? "Not yet scored"}
                  {lead.lead_category ? ` · ${lead.lead_category}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Reasoning</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.score_reasoning || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Source</dt>
                <dd className="text-[var(--color-ink)]">{lead.source}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Submitted</dt>
                <dd className="text-[var(--color-ink)]">
                  {new Date(lead.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
              <MapPin
                className="h-4 w-4 text-[var(--color-lapis)]"
                strokeWidth={1.75}
              />
              Trip details
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--color-muted)]">Country</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.country || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Travel date</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.travel_date || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Duration</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.trip_duration ? `${lead.trip_duration} days` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Group size</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.group_size ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Regions</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.interested_regions?.length
                    ? lead.interested_regions.join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Trip type</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.trip_type || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Tour preference</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.tour_preference || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Budget</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.budget_range || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Visited before</dt>
                <dd className="text-[var(--color-ink)]">
                  {lead.visited_before === true
                    ? "Yes"
                    : lead.visited_before === false
                      ? "No"
                      : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {Array.isArray(lead.concierge_transcript) &&
            lead.concierge_transcript.length > 0 && (
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-6">
                <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
                  <MessageSquare
                    className="h-4 w-4 text-[var(--color-lapis)]"
                    strokeWidth={1.75}
                  />
                  Concierge conversation
                </p>
                <div className="mt-3 space-y-2">
                  {(
                    lead.concierge_transcript as {
                      role: string;
                      content: string;
                    }[]
                  ).map((turn, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                        turn.role === "user"
                          ? "ml-auto rounded-br-sm bg-[var(--color-lapis)] text-white"
                          : "rounded-bl-sm bg-[var(--color-paper)] text-[var(--color-ink)]"
                      }`}
                    >
                      {turn.content}
                    </div>
                  ))}
                </div>
              </div>
            )}

          <form
            action={updateLeadStatus}
            className="mt-6 flex items-center gap-3"
          >
            <input type="hidden" name="id" value={lead.id} />
            <label
              htmlFor="status"
              className="text-sm text-[var(--color-muted)]"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={lead.status}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-lapis)] focus:outline-none focus:ring-2 focus:ring-[var(--color-lapis)]/20"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Booked">Booked</option>
              <option value="Lost">Lost</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-lapis)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-lapis-deep)]"
            >
              Save
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
