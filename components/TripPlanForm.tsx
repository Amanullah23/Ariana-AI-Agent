"use client";

import { useState, FormEvent } from "react";
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
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-md border border-[#E4D9C8] bg-[#FAF7F2] p-6 text-center">
          <p className="font-serif text-xl text-[#1C1A17]">
            You&apos;re on the list
          </p>
          <p className="mt-2 text-sm text-[#5B554B]">{message}</p>
        </div>
        <ConciergeChat leadId={leadId} />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded-md border border-[#E4D9C8] bg-[#FAF7F2] p-8"
    >
      <h2 className="font-serif text-2xl text-[#1C1A17]">
        Plan my Afghanistan trip
      </h2>
      <p className="mt-1 text-sm text-[#5B554B]">
        Tell us a little about what you&apos;re after — we&apos;ll take it from
        there.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-[#1C1A17]">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-[#D8CCB8] bg-white px-3 py-2 text-[#1C1A17] focus:border-[#B5541F] focus:outline-none focus:ring-1 focus:ring-[#B5541F]"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-[#1C1A17]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-[#D8CCB8] bg-white px-3 py-2 text-[#1C1A17] focus:border-[#B5541F] focus:outline-none focus:ring-1 focus:ring-[#B5541F]"
          />
        </div>

        <div>
          <label htmlFor="interest" className="block text-sm text-[#1C1A17]">
            What are you interested in?{" "}
            <span className="text-[#8A8272]">(optional)</span>
          </label>
          <textarea
            id="interest"
            rows={3}
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="Cultural sites, trekking, photography, a specific region..."
            className="mt-1 w-full rounded border border-[#D8CCB8] bg-white px-3 py-2 text-[#1C1A17] placeholder:text-[#B3AA98] focus:border-[#B5541F] focus:outline-none focus:ring-1 focus:ring-[#B5541F]"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-[#5B554B]">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            I&apos;d like Ariana Expeditions to contact me by email about my
            trip. You can unsubscribe at any time.
          </span>
        </label>

        {status === "error" && (
          <p className="text-sm text-[#B5541F]">{message}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || !consent}
          className="w-full rounded bg-[#B5541F] px-4 py-2.5 font-medium text-white transition hover:bg-[#984619] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? "Sending..." : "Start planning my trip"}
        </button>
      </div>
    </form>
  );
}
