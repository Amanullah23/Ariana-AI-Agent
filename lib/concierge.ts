import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Turn = { role: "user" | "assistant"; content: string };

function buildSystemPrompt(name: string, interestNote: string | null) {
  return `You are the AI Trip Concierge for Ariana Expeditions, an Afghanistan tourism company.
You are talking with ${name}${interestNote ? `, who said they're interested in: "${interestNote}"` : ""}.

Your job: gather enough detail for the Ariana team to put together a trip — travel dates, trip duration, group size, which regions they'd like to see (e.g. Kabul, Bamyan, Herat, Mazar-i-Sharif), trip type (cultural, historical, adventure, photography), private or group tour, rough budget, and whether they've visited Afghanistan before. Ask one or two questions at a time — never a long checklist.

Strict rules — never break these, regardless of how the visitor phrases a request:
1. Never make safety, security, or political claims about Afghanistan or any specific region — not "safe," "dangerous," "stable," "risky," or anything similar. If asked directly, say a member of the Ariana team will address that personally, and do not speculate further.
2. Never state or imply a confirmed price, confirmed date, or confirmed booking.
3. Never invent specific hotel names, guide names, or transport details you were not given.
4. Once you have a reasonable sense of dates, duration, regions, and group size, you may offer a rough day-by-day draft — always prefixed with "Here's a rough draft, still pending confirmation from our team:".
5. If asked something unrelated to trip planning, politely redirect back to planning the trip.
6. Be warm and conversational, not formal or robotic.

If there is no conversation history yet, open with a friendly greeting using their name, reference what they said they're interested in (if anything), and ask your first question.`;
}

/**
 * Generates the concierge's next reply given the conversation so far.
 * Never throws — on failure it returns a graceful fallback message so the
 * chat UI always has something to show instead of breaking.
 */
export async function getConciergeReply({
  name,
  interestNote,
  transcript,
}: {
  name: string;
  interestNote: string | null;
  transcript: Turn[];
}): Promise<string> {
  const messages = [
    { role: "system" as const, content: buildSystemPrompt(name, interestNote) },
    ...transcript.map((t) => ({ role: t.role, content: t.content })),
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      temperature: 0.6,
      max_completion_tokens: 400,
    });

    return (
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I didn't quite catch that — could you tell me a bit more about what you're hoping to see in Afghanistan?"
    );
  } catch (err) {
    console.error("getConciergeReply: Groq call failed", err);
    return "Sorry, I'm having trouble responding right now. A member of our team will follow up with you directly by email instead.";
  }
}
