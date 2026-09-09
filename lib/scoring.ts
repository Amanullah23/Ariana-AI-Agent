import Groq from "groq-sdk";
import { supabaseAdmin } from "./supabase-admin";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a lead-scoring assistant for Ariana Expeditions, an Afghanistan tourism company.
Score how ready-to-book a lead is, based only on what they have actually stated — never invent details they did not mention.

Score higher (70-100) for specific travel dates, named regions (e.g. Kabul, Bamyan, Herat), trip duration, group size, or budget.
Score moderate (40-69) for clear interest without much specificity.
Score low (0-39) for vague, minimal, or missing interest details (e.g. just a name and email with no stated interest).

Respond with strict JSON only, no other text:
{"score": <integer 0-100>, "reasoning": "<one sentence, under 20 words, specific to this lead>"}`;

type Category = "Hot" | "Warm" | "Cold";

function categoryFromScore(score: number): Category {
  if (score >= 75) return "Hot";
  if (score >= 40) return "Warm";
  return "Cold";
}

/**
 * Scores a lead by id and writes lead_score / lead_category / score_reasoning
 * back to Supabase. Designed to be called from `after()` in the API route so
 * it never delays the response to the visitor. Never throws — on any
 * failure it falls back to a safe low score so the lead still surfaces for
 * manual review instead of silently having no score at all.
 */
export async function scoreLead(leadId: string) {
  const { data: lead, error: fetchError } = await supabaseAdmin
    .from("leads")
    .select(
      "name, interest_note, country, travel_date, trip_duration, group_size, interested_regions, budget_range, concierge_transcript",
    )
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) {
    console.error("scoreLead: could not load lead", leadId, fetchError);
    return;
  }

  const summary = [
    `Name: ${lead.name}`,
    `Stated interest: ${lead.interest_note || "(none given)"}`,
    lead.country ? `Country: ${lead.country}` : null,
    lead.travel_date ? `Travel date: ${lead.travel_date}` : null,
    lead.trip_duration ? `Duration: ${lead.trip_duration} days` : null,
    lead.group_size ? `Group size: ${lead.group_size}` : null,
    lead.interested_regions?.length
      ? `Regions: ${lead.interested_regions.join(", ")}`
      : null,
    lead.budget_range ? `Budget: ${lead.budget_range}` : null,
    // Module 5 (AI Concierge) isn't built yet — this stays empty until it is,
    // at which point re-scoring picks up the richer conversation for free.
    lead.concierge_transcript
      ? `Concierge conversation: ${JSON.stringify(lead.concierge_transcript)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  let score = 20;
  let reasoning =
    "Default score — AI scoring did not return a usable result; needs manual review.";

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: summary },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content;
    if (raw) {
      // Some models wrap JSON in a markdown code fence even when JSON mode
      // is requested — strip it defensively before parsing.
      const jsonText = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```$/, "");
      const parsed = JSON.parse(jsonText);
      if (typeof parsed.score === "number" && Number.isFinite(parsed.score)) {
        score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      }
      if (typeof parsed.reasoning === "string" && parsed.reasoning.trim()) {
        reasoning = parsed.reasoning.trim();
      }
    }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error("scoreLead: Groq call failed for", leadId, err);
    // Written straight into the lead's row so the real cause is visible in
    // Supabase directly, without needing to go dig through server logs.
    reasoning = `Default score — Groq call failed: ${errMessage.slice(0, 180)}`;
  }

  const category = categoryFromScore(score);

  const { error: updateError } = await supabaseAdmin
    .from("leads")
    .update({
      lead_score: score,
      lead_category: category,
      score_reasoning: reasoning,
    })
    .eq("id", leadId);

  if (updateError) {
    console.error("scoreLead: failed to save score for", leadId, updateError);
  }
}
