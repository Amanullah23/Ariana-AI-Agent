import Groq from "groq-sdk";
import { supabaseAdmin } from "./supabase-admin";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_PROMPT = `You extract structured trip-planning details from a conversation between a travel company's AI concierge and a visitor. Read the full conversation and pull out only what the visitor has actually stated — never invent or guess a value they did not mention; use null (or an empty array for regions) when something is unclear.

Respond with strict JSON only, no other text, in exactly this shape:
{
  "country": <string or null, where the visitor is traveling from>,
  "travel_date": <string or null, e.g. "November 2026" — keep it phrased as they said it>,
  "trip_duration": <integer number of days, or null>,
  "group_size": <integer, or null>,
  "interested_regions": <array of strings, e.g. ["Kabul", "Bamyan"], or []>,
  "trip_type": <string or null, e.g. "Cultural", "Historical", "Adventure", "Photography">,
  "tour_preference": <"Private", "Group", or null>,
  "budget_range": <string or null, keep phrased as they said it>,
  "visited_before": <true, false, or null if not mentioned>
}`;

type Turn = { role: string; content: string };

/**
 * Re-reads a lead's full concierge transcript and updates the structured
 * trip-detail columns from it. Safe to call repeatedly — only overwrites
 * fields it can confidently extract, and never throws.
 */
export async function extractTripDetails(leadId: string) {
  const { data: lead, error: fetchError } = await supabaseAdmin
    .from("leads")
    .select("concierge_transcript")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead?.concierge_transcript) return;

  const transcript = lead.concierge_transcript as Turn[];
  if (!Array.isArray(transcript) || transcript.length === 0) return;

  const transcriptText = transcript
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n");

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: transcriptText },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return;

    const jsonText = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/, "");
    const parsed = JSON.parse(jsonText);

    const update: Record<string, unknown> = {};
    if (typeof parsed.country === "string" && parsed.country)
      update.country = parsed.country;
    if (typeof parsed.travel_date === "string" && parsed.travel_date)
      update.travel_date = parsed.travel_date;
    if (
      typeof parsed.trip_duration === "number" &&
      Number.isFinite(parsed.trip_duration)
    )
      update.trip_duration = Math.round(parsed.trip_duration);
    if (
      typeof parsed.group_size === "number" &&
      Number.isFinite(parsed.group_size)
    )
      update.group_size = Math.round(parsed.group_size);
    if (Array.isArray(parsed.interested_regions)) {
      const regions = parsed.interested_regions.filter(
        (r: unknown) => typeof r === "string",
      );
      if (regions.length) update.interested_regions = regions;
    }
    if (typeof parsed.trip_type === "string" && parsed.trip_type)
      update.trip_type = parsed.trip_type;
    if (typeof parsed.tour_preference === "string" && parsed.tour_preference)
      update.tour_preference = parsed.tour_preference;
    if (typeof parsed.budget_range === "string" && parsed.budget_range)
      update.budget_range = parsed.budget_range;
    if (typeof parsed.visited_before === "boolean")
      update.visited_before = parsed.visited_before;

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update(update)
        .eq("id", leadId);
      if (updateError) {
        console.error(
          "extractTripDetails: failed to save for",
          leadId,
          updateError,
        );
      }
    }
  } catch (err) {
    console.error("extractTripDetails: Groq call failed for", leadId, err);
    // Non-critical — the raw transcript is already saved and visible either way.
  }
}
