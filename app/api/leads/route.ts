import { NextRequest, NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scoreLead } from "@/lib/scoring";
import { sendWelcomeEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const { name, email, interest, consent } = body as {
    name?: string;
    email?: string;
    interest?: string;
    consent?: boolean;
  };

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (consent !== true) {
    return NextResponse.json(
      { error: "Please confirm consent before submitting." },
      { status: 400 },
    );
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedInterest = interest?.trim() || null;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .upsert(
      {
        name: trimmedName,
        email: trimmedEmail,
        interest_note: trimmedInterest,
        source: "website_form",
        status: "New",
        consent_status: true,
        consent_timestamp: new Date().toISOString(),
        // Filling the form again with consent checked is a fresh opt-in —
        // it overrides any earlier unsubscribe for this email address.
        unsubscribe_status: false,
      },
      { onConflict: "email", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 },
    );
  }

  // Both run after the response has been sent to the visitor — neither an
  // LLM call nor an email send should make them wait for the confirmation
  // message. Independent calls so a failure in one never blocks the other.
  after(() => scoreLead(data.id));
  after(() =>
    sendWelcomeEmail({
      id: data.id,
      name: trimmedName,
      email: trimmedEmail,
      interestNote: trimmedInterest,
    }),
  );

  return NextResponse.json(
    {
      id: data.id,
      message:
        "Thanks — we've received your request. Our team will follow up by email shortly.",
    },
    { status: 201 },
  );
}
