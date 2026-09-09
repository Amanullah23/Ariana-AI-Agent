import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import RunTrendDiscoveryButton from "@/components/RunTrendDiscoveryButton";

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
    <main className="min-h-screen bg-[#FAF7F2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-[#5B554B] underline"
            >
              ← Back to leads
            </Link>
            <h1 className="mt-2 font-serif text-2xl text-[#1C1A17]">
              Trend discovery
            </h1>
            <p className="text-sm text-[#8A8272]">
              Research on what people are asking about Afghanistan travel, for
              the content and blog calendar.
            </p>
          </div>
          <RunTrendDiscoveryButton />
        </div>

        {error && (
          <p className="mt-4 text-sm text-[#B5541F]">
            Couldn&apos;t load reports: {error.message}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {reports?.length === 0 && (
            <p className="text-sm text-[#8A8272]">
              No reports yet — click &quot;Run trend discovery now&quot; to
              generate the first one. It takes a bit (several searches plus a
              synthesis step), so give it a moment.
            </p>
          )}
          {reports?.map((report) => (
            <div
              key={report.id}
              className="rounded-md border border-[#E4D9C8] bg-white p-6"
            >
              <p className="text-xs text-[#8A8272]">
                {new Date(report.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-[#1C1A17]">{report.summary}</p>

              {report.themes && report.themes.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#8A8272]">Themes</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {report.themes.map((t, i) => (
                      <span
                        key={i}
                        className="rounded bg-[#F0E6C8] px-2 py-1 text-xs text-[#6B5A12]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {report.suggested_topics &&
                report.suggested_topics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-[#8A8272]">
                      Suggested blog topics
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-[#1C1A17]">
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
  );
}
