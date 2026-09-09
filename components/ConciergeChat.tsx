"use client";

import { useEffect, useRef, useState } from "react";

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
    <div className="mx-auto flex max-w-md flex-col rounded-md border border-[#E4D9C8] bg-[#FAF7F2]">
      <div className="border-b border-[#E4D9C8] p-4">
        <p className="font-serif text-lg text-[#1C1A17]">Trip planning chat</p>
        <p className="text-xs text-[#8A8272]">
          Talking with the Ariana AI Concierge
        </p>
      </div>

      <div className="flex h-96 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm ${
              m.role === "user"
                ? "self-end bg-[#B5541F] text-white"
                : "self-start bg-white text-[#1C1A17]"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start rounded-md bg-white px-3 py-2 text-sm text-[#8A8272]">
            Typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-[#E4D9C8] p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply..."
          disabled={loading}
          className="flex-1 rounded border border-[#D8CCB8] bg-white px-3 py-2 text-sm focus:border-[#B5541F] focus:outline-none focus:ring-1 focus:ring-[#B5541F]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded bg-[#B5541F] px-4 py-2 text-sm font-medium text-white hover:bg-[#984619] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
