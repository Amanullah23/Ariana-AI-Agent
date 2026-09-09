"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function ConciergeChat({ leadId }: { leadId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    sendToConcierge(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendToConcierge(userMessage: string | null) {
    setLoading(true);
    if (userMessage) {
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    }
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, message: userMessage }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, something went wrong. Our team will follow up by email instead.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Couldn't reach the server. Our team will follow up by email instead.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    sendToConcierge(text);
  }

  return (
    <div className="animate-fade-in-up mx-auto flex max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-paper)] px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-lapis)] text-white">
          <Bot className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-display text-base text-[var(--color-ink)]">
            AI Trip Concierge
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            Usually replies in a few seconds
          </p>
        </div>
      </div>

      <div className="flex h-96 flex-col gap-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`animate-message-in flex items-end gap-2 ${
              m.role === "user" ? "flex-row-reverse self-end" : "self-start"
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                m.role === "user"
                  ? "bg-[var(--color-gold)] text-white"
                  : "bg-[var(--color-lapis)] text-white"
              }`}
            >
              {m.role === "user" ? (
                <User className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
            </div>
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "rounded-br-sm bg-[var(--color-lapis)] text-white"
                  : "rounded-bl-sm bg-[var(--color-paper)] text-[var(--color-ink)]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2 self-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-lapis)] text-white">
              <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[var(--color-paper)] px-4 py-3">
              <span
                className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
                style={{ animationDelay: "0s" }}
              />
              <span
                className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-[var(--color-border)] p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply..."
          disabled={loading}
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-[var(--color-lapis)] focus:outline-none focus:ring-2 focus:ring-[var(--color-lapis)]/20"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-[var(--color-lapis)] px-4 py-2.5 text-white transition-colors hover:bg-[var(--color-lapis-deep)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );
}
