"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOpportunityStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const supabase = await createClient();
  const { error } = await supabase
    .from("engagement_opportunities")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("updateOpportunityStatus failed:", error);
  }

  revalidatePath("/dashboard/engagement");
}
