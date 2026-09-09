import Groq from "groq-sdk";
import { supabaseAdmin } from "./supabase-admin";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Fixed query set for now — a reasonable starting spread of what people
// actually ask about Afghanistan travel. Easy to tune once you see what
// kind of results each query actually surfaces.
const SEARCH_QUERIES = [
  "Afghanistan travel forum questions 2026",
  "is it safe to travel to Afghanistan tourist",
  "Afghanistan tourism visa requirements",
  "Bamyan Kabul travel blog experience",
  "backpacking Afghanistan trip report",
];

type TavilyResult = { title: string; url: string; content: string };

async function tavilySearch(
  query: string,
): Promise<{ results: TavilyResult[]; errorDetail: string | null }> {
  if (!process.env.TAVILY_API_KEY) {
    return {
      results: [],
      errorDetail: "TAVILY_API_KEY is not set in this environment.",
    };
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      // Some Tavily-side WAF/CDN layers block requests with no
      // User-Agent — Node's fetch doesn't set one by default.
      "User-Agent": "AriananAgentAI/1.0 (+https://ariana-ai-agent.vercel.app)",
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
      topic: "general",
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    console.error("tavilySearch failed for", query, res.status, bodyText);
    return {
      results: [],
      errorDetail: `Tavily ${res.status}: ${bodyText.slice(0, 200)}`,
    };
  }

  const data = await res.json();
  return {
    results: Array.isArray(data.results) ? data.results : [],
    errorDetail: null,
  };
}

const SYNTHESIS_PROMPT = `You're a content strategist for Ariana Expeditions, an Afghanistan tourism company. Below are web search results showing what people are publicly asking, writing, and discussing about traveling to Afghanistan.

Read through them and identify:
1. The recurring themes and questions people actually have (visa process, safety questions, specific regions, cost, etc.)
2. Five concrete blog post topics Ariana's content team could write to address these

Do not answer any safety or security question yourself — just note that people are asking about it as a theme, the same way you'd note any other recurring topic. Respond with strict JSON only, no other text:
{
  "summary": "<2-3 sentence overview of what's trending>",
  "themes": [<array of short theme strings>],
  "suggested_topics": [<array of 5 concrete blog post title strings>]
}`;

/**
 * Runs the fixed search queries through Tavily, hands the combined results
 * to Groq for synthesis, and saves the report to Supabase. Always saves a
 * row — even a failed synthesis still records what was searched, so a bad
 * run is visible in the dashboard rather than silently vanishing.
 */
export async function runTrendDiscovery() {
  const allResults: { query: string; results: TavilyResult[] }[] = [];
  const errors: string[] = [];

  for (const query of SEARCH_QUERIES) {
    const { results, errorDetail } = await tavilySearch(query);
    allResults.push({ query, results });
    if (errorDetail) errors.push(errorDetail);
  }

  const digestText = allResults
    .flatMap(({ query, results }) =>
      results.map((r) => `[from query "${query}"] ${r.title}: ${r.content}`),
    )
    .join("\n\n");

  let summary = errors.length
    ? `No search results came back from any query. Last error: ${errors[errors.length - 1]}`
    : "Not enough search results to summarize this run.";
  let themes: string[] = [];
  let suggestedTopics: string[] = [];

  if (digestText.trim()) {
    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYNTHESIS_PROMPT },
          { role: "user", content: digestText.slice(0, 12000) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const jsonText = raw
          .trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/```$/, "");
        const parsed = JSON.parse(jsonText);
        if (typeof parsed.summary === "string") summary = parsed.summary;
        if (Array.isArray(parsed.themes)) themes = parsed.themes;
        if (Array.isArray(parsed.suggested_topics))
          suggestedTopics = parsed.suggested_topics;
      }
    } catch (err) {
      console.error("runTrendDiscovery: synthesis failed", err);
    }
  }

  const { data, error } = await supabaseAdmin
    .from("trend_reports")
    .insert({
      queries_used: SEARCH_QUERIES,
      raw_results: allResults,
      summary,
      themes,
      suggested_topics: suggestedTopics,
    })
    .select("*")
    .single();

  if (error) {
    console.error("runTrendDiscovery: failed to save report", error);
    throw new Error("Failed to save trend report.");
  }

  return data;
}
