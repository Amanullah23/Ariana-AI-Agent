import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runTrendDiscovery } from "@/lib/trend-discovery";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const report = await runTrendDiscovery();
    return NextResponse.json({ report }, { status: 200 });
  } catch (err) {
    console.error("trend-discovery route failed:", err);
    return NextResponse.json(
      { error: "Trend discovery failed. Check server logs for details." },
      { status: 500 },
    );
  }
}
