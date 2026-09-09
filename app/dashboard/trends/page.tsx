import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import RunTrendDiscoveryButton from "@/components/RunTrendDiscoveryButton";
import { Sparkles } from "lucide-react";

type TrendReport = {
  id: string;
  summary: string | null;
  themes: string[] | null;
  suggested_topics: string[] | null;
  created_at: string;
};

export default async function TrendsPage() {
  const supabase = await createClient();
  const { data: reports, error } = await supabase
    .from("trend_reports")
    .select("id, summary, themes, suggested_topics, created_at")
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<TrendReport[]>();

  return (
    <>
      <DashboardNav />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl text-[var(--color-ink)]">
                Trend discovery
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Research on what people are asking about Afghanistan travel, for
                the content and blog calendar.
              </p>
            </div>
            <RunTrendDiscoveryButton />
          </div>

          {error && (
            <p className="mt-4 text-sm text-[var(--color-rust)]">
              Couldn&apos;t load reports: {error.message}
            </p>
          )}

          <div className="mt-6 space-y-4">
            {reports?.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">
                No reports yet — click &quot;Run trend discovery now&quot; to
                generate the first one. It takes a bit (several searches plus a
                synthesis step), so give it a moment.
              </p>
            )}
            {reports?.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-[var(--color-border)] bg-white p-6"
              >
                <p className="text-xs text-[var(--color-muted)]">
                  {new Date(report.created_at).toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-[var(--color-ink)]">
                  {report.summary}
                </p>

                {report.themes && report.themes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-[var(--color-muted)]">
                      Themes
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {report.themes.map((t, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-[var(--color-gold)]/15 px-2.5 py-1 text-xs text-[var(--color-gold)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {report.suggested_topics &&
                  report.suggested_topics.length > 0 && (
                    <div className="mt-4">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Suggested blog topics
                      </p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink)]">
                        {report.suggested_topics.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
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
