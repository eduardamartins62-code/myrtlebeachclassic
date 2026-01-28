"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function createRound(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const roundNumber = Number(formData.get("round_number") ?? 0);
  const courseName = String(formData.get("course_name") ?? "").trim();
  const date = String(formData.get("date") ?? "") || null;
  const startTime = String(formData.get("start_time") ?? "") || null;
  const parValue = formData.get("par");
  const par =
    parValue !== null && String(parValue).trim() !== ""
      ? Number(parValue)
      : null;
  const entryPinRaw = formData.get("entry_pin");
  const entryPin = entryPinRaw ? String(entryPinRaw).trim() : null;

  if (!eventId) {
    return { ok: false, error: "Missing event id." };
  }

  if (!roundNumber || !courseName) {
    return { ok: false, error: "Round number and course name are required." };
  }

  const { error } = await supabaseAdmin.from("rounds").insert([
    {
      event_id: eventId,
      round_number: roundNumber,
      course_name: courseName,
      date,
      start_time: startTime,
      par,
      entry_pin: entryPin
    }
  ]);

  if (error) {
    console.error("Error creating round:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/rounds?eventId=${eventId}`);
  return { ok: true, error: "" };
}
