"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function createRound(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();
  const eventId = String(formData.get("event_id") ?? "").trim();
  const roundNumber = Number(formData.get("round_number") ?? NaN);
  const courseName = String(
    formData.get("course_name") ?? formData.get("course") ?? ""
  ).trim();
  const dateValue = String(formData.get("date") ?? "").trim();
  const date = dateValue ? dateValue : null;
  const parValue = String(formData.get("par") ?? "").trim();
  const par = parValue ? Number(parValue) : null;
  const entryPin = String(formData.get("entry_pin") ?? "").trim();

  if (!eventId || Number.isNaN(roundNumber)) {
    return { ok: false, error: "Event and round number are required." };
  }

  const payload: {
    event_id: string;
    round_number: number;
    course: string;
    date: string | null;
    par?: number;
    entry_pin?: string | null;
  } = {
    event_id: eventId,
    round_number: roundNumber,
    course: courseName,
    date
  };

  if (par !== null && !Number.isNaN(par)) {
    payload.par = par;
  }

  if (entryPin) {
    payload.entry_pin = entryPin;
  }

  const { error } = await supabaseAdmin.from("rounds").insert(payload);

  if (error) {
    console.error("Error creating round:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/rounds");
  return { ok: true, error: "" };
}
