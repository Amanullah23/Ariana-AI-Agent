import Groq from "groq-sdk";
import { supabaseAdmin } from "./supabase-admin";
import { tavilySearch, sleep, type TavilyResult } from "./tavily";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SEARCH_QUERIES = [
  "asking about traveling to Afghanistan forum",
  "is it safe to visit Afghanistan question",
  "planning trip to Afghanistan advice needed",
  "Afghanistan tourist visa question help",
  "has anyone visited Afghanistan travel experience question",
];

const REPLY_SYNTHESIS_PROMPT = `You're a social-media engagement assistant for Ariana Expeditions, an Afghanistan tourism company.

You'll be given a batch of public web search results. Some of them are individual people asking a genuine, specific question about traveling to Afghanistan (in a forum post, comment, or Q&A site). Others are just articles, guides, or listicles — not a real person asking something.

Your job: find only the genuine individual questions (up to 5), and for each one, draft a short, warm, transparent reply that a real person at Ariana Expeditions could post publicly, under Ariana's own name, replying openly in that same public thread.

Hard rules for every drafted reply:
- Never assert a safety or security verdict — no "yes it's safe," "it's dangerous," or any risk judgment. If the question is about safety, acknowledge it's a fair and common question, note that conditions vary and deserve a current, specific answer, and invite them to reach out to Ariana directly rather than answering it yourself.
- Never quote a firm price.
- Keep it short (2-4 sentences), genuine, and helpful — not salesy, not a sales pitch, not spammy. Mentioning Ariana Expeditions naturally once is enough.
- If nothing in the batch is a genuine individual question, return an empty array — don't force it.

Respond with strict JSON only, no other text, in exactly this shape:
{
  "opportunities": [
    {
      "source_url": "<the url>",
      "source_title": "<the title>",
      "detected_question": "<a short summary of what they actually asked>",
      "suggested_reply": "<the drafted reply>"
    }
  ]
}`;

/**
 * Searches for public posts, has Groq filter down to genuine individual
 * questions and draft replies, and saves each as a row for the owner to
 * review. Throws on a total failure (no results, no valid response) so
 * the API route can surface a real error — unlike scoring/email, there's
 * nothing useful to save on a failed run here.
 */
export async function runEngagementDiscovery() {
  const allResults: { query: string; results: TavilyResult[] }[] = [];
  const errors: string[] = [];

  for (const query of SEARCH_QUERIES) {
    const { results, errorDetail } = await tavilySearch(query);
    allResults.push({ query, results });
    if (errorDetail) errors.push(errorDetail);
    await sleep(600); // space out requests — a tight burst is a common WAF trigger
  }

  const digestText = allResults
    .flatMap(({ results }) =>
      results.map(
        (r) => `URL: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`,
      ),
    )
    .join("\n\n---\n\n");

  if (!digestText.trim()) {
    throw new Error(
      errors.length
        ? `No search results came back. Last error: ${errors[errors.length - 1]}`
        : "No search results came back from any query.",
    );
  }

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: REPLY_SYNTHESIS_PROMPT },
      { role: "user", content: digestText.slice(0, 14000) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from the synthesis model.");

  const jsonText = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");
  const parsed = JSON.parse(jsonText);
  const rawOpportunities = Array.isArray(parsed.opportunities)
    ? parsed.opportunities
    : [];

  type RawOpportunity = {
    source_url?: unknown;
    source_title?: unknown;
    detected_question?: unknown;
    suggested_reply?: unknown;
  };

  const rows = (rawOpportunities as RawOpportunity[])
    .filter(
      (o) =>
        typeof o.source_url === "string" &&
        typeof o.detected_question === "string" &&
        typeof o.suggested_reply === "string",
    )
    .map((o) => ({
      source_url: o.source_url as string,
      source_title: typeof o.source_title === "string" ? o.source_title : null,
      detected_question: o.detected_question as string,
      suggested_reply: o.suggested_reply as string,
      status: "New",
    }));

  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("engagement_opportunities")
    .insert(rows)
    .select("*");

  if (error) {
    console.error(
      "runEngagementDiscovery: failed to save opportunities",
      error,
    );
    throw new Error("Failed to save engagement opportunities.");
  }

  return data;
}
