"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-[#B5541F] px-4 py-2 text-sm font-medium text-white hover:bg-[#984619] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Researching..." : "Run trend discovery now"}
      </button>
      {error && <p className="mt-2 text-sm text-[#B5541F]">{error}</p>}
    </div>
  );
}
