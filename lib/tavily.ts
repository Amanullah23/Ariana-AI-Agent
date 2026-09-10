export type TavilyResult = { title: string; url: string; content: string };

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tavilySearch(
  query: string,
  attempt = 1,
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
    console.error(
      "tavilySearch failed for",
      query,
      res.status,
      bodyText,
      "attempt",
      attempt,
    );

    // A bare, unbranded "<html>403 Forbidden</html>" (no JSON body) reads
    // as a transient WAF/burst-rate block rather than a real auth
    // rejection — Tavily's actual auth errors come back as JSON. Worth a
    // couple of retries with backoff before giving up on this query.
    const looksLikeWafBlock =
      res.status === 403 && bodyText.trim().startsWith("<html");
    if (looksLikeWafBlock && attempt < 3) {
      await sleep(attempt * 1500);
      return tavilySearch(query, attempt + 1);
    }

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
