"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function createEvent(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!name || !slug) {
    return { ok: false, error: "Name and slug are required." };
  }

  const { error } = await supabaseAdmin
    .from("events")
    .insert([{ name, slug }]);

  if (error) {
    console.error("Error creating event:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/events");
  return { ok: true, error: "" };
}
