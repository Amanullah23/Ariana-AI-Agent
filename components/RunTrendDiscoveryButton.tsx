"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export default function RunTrendDiscoveryButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trend-discovery", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0 text-right">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-[var(--color-lapis)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-lapis-deep)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        )}
        {loading ? "Researching..." : "Run trend discovery now"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-[var(--color-rust)]">{error}</p>
      )}
    </div>
  );
}
