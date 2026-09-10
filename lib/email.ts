import { Resend } from "resend";
import { supabaseAdmin } from "./supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

// Swap this to your own verified domain once it's added and verified in
// Resend — onboarding@resend.dev works with zero DNS setup, but can only
// deliver to the email address on your own Resend account until then.
const FROM_ADDRESS =
  process.env.EMAIL_FROM || "Ariana Expeditions <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type WelcomeEmailInput = {
  id: string;
  name: string;
  email: string;
  interestNote: string | null;
};

// Where the "a lead just went Hot" alert goes. A one-line env override
// so this can change later without touching code — falls back to a
// fixed address for now.
const OWNER_NOTIFICATION_EMAIL =
  process.env.OWNER_NOTIFICATION_EMAIL || "amanyawari220@gmail.com";

type HotLeadInput = {
  id: string;
  name: string;
  email: string;
  interestNote: string | null;
  leadScore: number | null;
  scoreReasoning: string | null;
};

/**
 * Sends the owner a one-time alert the moment a lead first crosses into
 * Hot. Deliberately separate from the visitor-facing welcome email — this
 * goes to the owner's own inbox, not the lead's. Caller is responsible for
 * only invoking this once per lead (see the hot_notified flag in scoring.ts)
 * — this function itself doesn't check that, so it's not safe to call
 * repeatedly without that guard.
 */
export async function sendHotLeadNotification({
  id,
  name,
  email,
  interestNote,
  leadScore,
  scoreReasoning,
}: HotLeadInput) {
  const dashboardUrl = `${APP_URL}/dashboard/leads/${id}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1C1A17;">
      <h1 style="font-size: 20px;">🔥 Hot lead: ${escapeHtml(name)}</h1>
      <p style="font-size: 15px;">Score: <strong>${leadScore ?? "?"}</strong></p>
      ${scoreReasoning ? `<p style="color: #5B554B;">${escapeHtml(scoreReasoning)}</p>` : ""}
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${interestNote ? `<p><strong>Stated interest:</strong> ${escapeHtml(interestNote)}</p>` : ""}
      <p style="margin-top: 28px;">
        <a href="${dashboardUrl}" style="color: #1F4E79; font-weight: bold;">View this lead in the dashboard →</a>
      </p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: OWNER_NOTIFICATION_EMAIL,
      subject: `🔥 Hot lead: ${name}`,
      html,
    });
    if (error) {
      console.error(
        "sendHotLeadNotification: Resend returned an error for",
        id,
        error,
      );
    }
  } catch (err) {
    console.error("sendHotLeadNotification: send failed for", id, err);
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends the initial confirmation email after a lead submits the capture
 * form. Personalization here is deliberately literal — it quotes back what
 * the lead actually typed, rather than having AI generate new prose for an
 * outbound email. Never throws; a failed send is logged and swallowed so
 * it can't break the request that triggered it.
 */
export async function sendWelcomeEmail({
  id,
  name,
  email,
  interestNote,
}: WelcomeEmailInput) {
  // Defense in depth: re-check unsubscribe status right before sending, in
  // case this function is ever called from somewhere other than a brand
  // new signup (e.g. a future drip step).
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("unsubscribe_status")
    .eq("id", id)
    .single();

  if (lead?.unsubscribe_status) {
    return;
  }

  const unsubscribeUrl = `${APP_URL}/api/unsubscribe?id=${id}`;
  const firstName = name.trim().split(" ")[0] || name.trim();

  const interestLine = interestNote
    ? `<p>You mentioned: <em>"${escapeHtml(interestNote)}"</em> — we'll use that to put together some ideas.</p>`
    : `<p>We'll be in touch shortly to learn more about what you're hoping to see.</p>`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1C1A17;">
      <h1 style="font-size: 22px;">Thanks, ${escapeHtml(firstName)}</h1>
      <p>We've received your request to plan an Afghanistan trip with Ariana Expeditions.</p>
      ${interestLine}
      <p>A member of our team will follow up personally within a day or two.</p>
      <p style="margin-top: 32px; font-size: 12px; color: #8A8272;">
        Don't want these emails? <a href="${unsubscribeUrl}" style="color: #8A8272;">Unsubscribe</a>.
      </p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "We've got your Afghanistan trip request",
      html,
    });
    if (error) {
      console.error(
        "sendWelcomeEmail: Resend returned an error for",
        id,
        error,
      );
    }
  } catch (err) {
    console.error("sendWelcomeEmail: send failed for", id, err);
  }
}
