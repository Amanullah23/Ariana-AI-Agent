import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runEngagementDiscovery } from "@/lib/engagement-discovery";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const opportunities = await runEngagementDiscovery();
    return NextResponse.json({ opportunities }, { status: 200 });
  } catch (err) {
    console.error("engagement-discovery route failed:", err);
    const message =
      err instanceof Error ? err.message : "Engagement discovery failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
