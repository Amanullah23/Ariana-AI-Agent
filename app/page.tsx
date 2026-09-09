import TripPlanForm from "@/components/TripPlanForm";
import SiteHeader from "@/components/SiteHeader";
import MountainSilhouette from "@/components/MountainSilhouette";
import { Compass } from "lucide-react";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <div className="h-48 w-full overflow-hidden sm:h-64">
        <MountainSilhouette />
      </div>

      <main className="px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="animate-fade-in-up -mt-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-lapis)] text-white shadow-md ring-4 ring-[var(--color-paper)]">
              <Compass className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="motif-divider mx-auto mt-5" />
            <h1 className="font-display mt-5 text-4xl font-medium tracking-tight text-[var(--color-ink)] sm:text-5xl">
              Discover Afghanistan
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-[var(--color-muted)]">
              Silk Road cities, the valleys of Bamyan, centuries of history —
              planned with Ariana Expeditions and an AI concierge that helps
              shape the trip around what you want to see.
            </p>
          </div>

          <div
            id="plan"
            className="animate-fade-in-up mt-12"
            style={{ animationDelay: "0.1s" }}
          >
            <TripPlanForm />
          </div>
        </div>
      </main>
    </>
  );
}
