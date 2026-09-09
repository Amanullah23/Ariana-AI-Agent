import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateLeadStatus } from "./actions";
import { signOut } from "@/app/login/actions";

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
    <main className="min-h-screen bg-[#FAF7F2] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-[#5B554B] underline">
            ← Back to leads
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-[#5B554B] underline">
              Sign out
            </button>
          </form>
        </div>

        <h1 className="mt-4 font-serif text-2xl text-[#1C1A17]">{lead.name}</h1>
        <p className="text-sm text-[#8A8272]">{lead.email}</p>

        <div className="mt-6 rounded-md border border-[#E4D9C8] bg-white p-6">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[#8A8272]">Stated interest</dt>
              <dd className="text-[#1C1A17]">{lead.interest_note || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">AI score</dt>
              <dd className="text-[#1C1A17]">
                {lead.lead_score ?? "Not yet scored"}
                {lead.lead_category ? ` · ${lead.lead_category}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Reasoning</dt>
              <dd className="text-[#1C1A17]">{lead.score_reasoning || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Source</dt>
              <dd className="text-[#1C1A17]">{lead.source}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Submitted</dt>
              <dd className="text-[#1C1A17]">
                {new Date(lead.created_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Trip details gathered by the AI Concierge (Module 5) — blank
            until the visitor has actually chatted and given some detail. */}
        <div className="mt-4 rounded-md border border-[#E4D9C8] bg-white p-6">
          <p className="text-sm font-medium text-[#1C1A17]">Trip details</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[#8A8272]">Country</dt>
              <dd className="text-[#1C1A17]">{lead.country || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Travel date</dt>
              <dd className="text-[#1C1A17]">{lead.travel_date || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Duration</dt>
              <dd className="text-[#1C1A17]">
                {lead.trip_duration ? `${lead.trip_duration} days` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Group size</dt>
              <dd className="text-[#1C1A17]">{lead.group_size ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Regions</dt>
              <dd className="text-[#1C1A17]">
                {lead.interested_regions?.length
                  ? lead.interested_regions.join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Trip type</dt>
              <dd className="text-[#1C1A17]">{lead.trip_type || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Tour preference</dt>
              <dd className="text-[#1C1A17]">{lead.tour_preference || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Budget</dt>
              <dd className="text-[#1C1A17]">{lead.budget_range || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#8A8272]">Visited before</dt>
              <dd className="text-[#1C1A17]">
                {lead.visited_before === true
                  ? "Yes"
                  : lead.visited_before === false
                    ? "No"
                    : "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Full AI Concierge conversation, if the visitor chatted at all. */}
        {Array.isArray(lead.concierge_transcript) &&
          lead.concierge_transcript.length > 0 && (
            <div className="mt-4 rounded-md border border-[#E4D9C8] bg-white p-6">
              <p className="text-sm font-medium text-[#1C1A17]">
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
                    className={`max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm ${
                      turn.role === "user"
                        ? "ml-auto bg-[#B5541F] text-white"
                        : "bg-[#FAF7F2] text-[#1C1A17]"
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
          <label htmlFor="status" className="text-sm text-[#5B554B]">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={lead.status}
            className="rounded border border-[#D8CCB8] px-3 py-2 text-sm"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Booked">Booked</option>
            <option value="Lost">Lost</option>
          </select>
          <button
            type="submit"
            className="rounded bg-[#B5541F] px-4 py-2 text-sm font-medium text-white hover:bg-[#984619]"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
