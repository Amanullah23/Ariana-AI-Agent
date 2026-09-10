import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import RunEngagementDiscoveryButton from "@/components/RunEngagementDiscoveryButton";
import { ExternalLink, MessageCircleQuestion } from "lucide-react";
import { updateOpportunityStatus } from "./actions";

type Opportunity = {
  id: string;
  source_url: string;
  source_title: string | null;
  detected_question: string | null;
  suggested_reply: string | null;
  status: string;
  created_at: string;
};

export default async function EngagementPage() {
  const supabase = await createClient();
  const { data: opportunities, error } = await supabase
    .from("engagement_opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<Opportunity[]>();

  return (
    <>
      <DashboardNav />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl text-[var(--color-ink)]">
                Public engagement
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Real people publicly asking about Afghanistan travel — drafted
                replies for your team to review and post yourselves, under
                Ariana&apos;s own name.
              </p>
            </div>
            <RunEngagementDiscoveryButton />
          </div>

          {error && (
            <p className="mt-4 text-sm text-[var(--color-rust)]">
              Couldn&apos;t load opportunities: {error.message}
            </p>
          )}

          <div className="mt-6 space-y-4">
            {opportunities?.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">
                No opportunities yet — click &quot;Find opportunities now&quot;
                to search. Not every run will find a genuine question;
                that&apos;s expected, it only surfaces real ones rather than
                forcing five results every time.
              </p>
            )}
            {opportunities?.map((opp) => (
              <div
                key={opp.id}
                className={`rounded-xl border border-[var(--color-border)] bg-white p-6 ${
                  opp.status !== "New" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={opp.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-lapis)] hover:underline"
                  >
                    {opp.source_title || opp.source_url}
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </a>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">
                    {opp.status}
                  </span>
                </div>

                <p className="mt-3 flex items-start gap-2 text-sm text-[var(--color-ink)]">
                  <MessageCircleQuestion
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
                    strokeWidth={1.75}
                  />
                  {opp.detected_question}
                </p>

                <div className="mt-3 rounded-lg bg-[var(--color-paper)] p-4 text-sm text-[var(--color-ink)]">
                  {opp.suggested_reply}
                </div>

                {opp.status === "New" && (
                  <div className="mt-4 flex gap-2">
                    <form action={updateOpportunityStatus}>
                      <input type="hidden" name="id" value={opp.id} />
                      <input type="hidden" name="status" value="Posted" />
                      <button
                        type="submit"
                        className="rounded-lg bg-[var(--color-lapis)] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-lapis-deep)]"
                      >
                        Mark as posted
                      </button>
                    </form>
                    <form action={updateOpportunityStatus}>
                      <input type="hidden" name="id" value={opp.id} />
                      <input type="hidden" name="status" value="Dismissed" />
                      <button
                        type="submit"
                        className="rounded-lg border border-[var(--color-border)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-rust)] hover:text-[var(--color-rust)]"
                      >
                        Dismiss
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
