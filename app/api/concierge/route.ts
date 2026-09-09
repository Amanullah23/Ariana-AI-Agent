import { NextRequest, NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getConciergeReply } from "@/lib/concierge";
import { scoreLead } from "@/lib/scoring";
import { extractTripDetails } from "@/lib/trip-extraction";

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { leadId, message } = body as { leadId?: string; message?: string };

  if (!leadId || typeof leadId !== "string") {
    return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
  }

  const { data: lead, error: fetchError } = await supabaseAdmin
    .from("leads")
    .select("name, interest_note, concierge_transcript")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const transcript: Turn[] = Array.isArray(lead.concierge_transcript)
    ? (lead.concierge_transcript as Turn[])
    : [];

  if (typeof message === "string" && message.trim()) {
    transcript.push({ role: "user", content: message.trim() });
  }

  const reply = await getConciergeReply({
    name: lead.name,
    interestNote: lead.interest_note,
    transcript,
  });

  transcript.push({ role: "assistant", content: reply });

  const { error: updateError } = await supabaseAdmin
    .from("leads")
    .update({ concierge_transcript: transcript })
    .eq("id", leadId);

  if (updateError) {
    console.error(
      "concierge: failed to save transcript for",
      leadId,
      updateError,
    );
  }

  // Re-score and re-extract now that the conversation has more to go on.
  // Both run after the reply is already sent — the visitor shouldn't wait
  // on two more Groq calls just to see their own message land.
  after(() => scoreLead(leadId));
  after(() => extractTripDetails(leadId));

  return NextResponse.json({ reply });
}
