import Link from "next/link";
import { Compass } from "lucide-react";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-lapis)] text-white">
            <Compass className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="font-display text-lg text-[var(--color-ink)]">
            Ariana Expeditions
          </span>
        </Link>
        <a
          href="#plan"
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-lapis)] hover:text-[var(--color-lapis)]"
        >
          Plan a trip
        </a>
      </div>
    </header>
  );
}
