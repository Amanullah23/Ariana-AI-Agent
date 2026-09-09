"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateLeadStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status, last_contacted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("updateLeadStatus failed:", error);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/leads/${id}`);
}
