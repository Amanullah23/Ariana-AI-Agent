import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing unsubscribe link.", { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ unsubscribe_status: true })
    .eq("id", id);

  if (error) {
    console.error("Unsubscribe failed for", id, error);
    return new NextResponse("Something went wrong. Please try again.", {
      status: 500,
    });
  }

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center; color: #1C1A17;">
        <h1 style="font-size: 20px;">You're unsubscribed</h1>
        <p style="color: #5B554B;">You won't receive any more emails from Ariana Expeditions about this request.</p>
      </body>
    </html>`,
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}
