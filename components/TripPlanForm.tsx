"use client";

import { useState, FormEvent } from "react";
import { User, Mail, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import ConciergeChat from "./ConciergeChat";

type Status = "idle" | "submitting" | "success" | "error";

export default function TripPlanForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, interest, consent }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Thanks — we've received your request.");
      setLeadId(data.id);
    } catch {
      setStatus("error");
      setMessage(
        "Couldn't reach the server. Check your connection and try again.",
      );
    }
  }

  if (status === "success" && leadId) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <div className="animate-fade-in-up flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-lapis)]"
            strokeWidth={1.75}
          />
          <div>
            <p className="font-display text-lg text-[var(--color-ink)]">
              You&apos;re on the list
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{message}</p>
          </div>
        </div>
        <ConciergeChat leadId={leadId} />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm"
    >
      <h2 className="font-display text-2xl text-[var(--color-ink)]">
        Plan my Afghanistan trip
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Tell us a little about what you&apos;re after — we&apos;ll take it from
        there.
      </p>

      <div className="mt-7 space-y-5">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
          >
            Name
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              strokeWidth={1.75}
            />
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-3 text-[var(--color-ink)] transition-colors focus:border-[var(--color-lapis)] focus:outline-none focus:ring-2 focus:ring-[var(--color-lapis)]/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              strokeWidth={1.75}
            />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-3 text-[var(--color-ink)] transition-colors focus:border-[var(--color-lapis)] focus:outline-none focus:ring-2 focus:ring-[var(--color-lapis)]/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="interest"
            className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
          >
            What are you interested in?{" "}
            <span className="font-normal text-[var(--color-muted)]">
              (optional)
            </span>
          </label>
          <div className="relative">
            <MessageCircle
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--color-muted)]"
              strokeWidth={1.75}
            />
            <textarea
              id="interest"
              rows={3}
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="Cultural sites, trekking, photography, a specific region..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-3 text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/70 transition-colors focus:border-[var(--color-lapis)] focus:outline-none focus:ring-2 focus:ring-[var(--color-lapis)]/20"
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-lapis)] focus:ring-[var(--color-lapis)]/30"
          />
          <span>
            I&apos;d like Ariana Expeditions to contact me by email about my
            trip. You can unsubscribe at any time.
          </span>
        </label>

        {status === "error" && (
          <p className="text-sm text-[var(--color-rust)]">{message}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || !consent}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-lapis)] px-4 py-3 font-medium text-white transition-colors hover:bg-[var(--color-lapis-deep)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {status === "submitting" ? "Sending..." : "Start planning my trip"}
        </button>
      </div>
    </form>
  );
}
