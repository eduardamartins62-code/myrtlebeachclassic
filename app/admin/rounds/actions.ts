"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function createRound(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();
  const eventId = String(formData.get("event_id") ?? "").trim();
  const roundNumber = Number(formData.get("round_number") ?? 0);
  const courseName = String(formData.get("course_name") ?? "").trim();
  const date = String(formData.get("date") ?? "") || null;
  const parValue = formData.get("par");
  const par =
    parValue !== null && String(parValue).trim() !== ""
      ? Number(parValue)
      : undefined;
  const entryPinRaw = formData.get("entry_pin");
  const entryPin = entryPinRaw ? String(entryPinRaw).trim() : undefined;

  if (!eventId) {
    return { ok: false, error: "Missing event id." };
  }

  if (!roundNumber || !courseName) {
    return {
      ok: false,
      error: "Round number and course name are required.",
    };
  }

  const payload: {
    event_id: string;
    round_number: number;
    course: string;
    date: string | null;
    par?: number;
    entry_pin?: string;
  } = {
    event_id: eventId,
    round_number: roundNumber,
    course: courseName,
    date,
  };

  if (typeof par === "number" && !Number.isNaN(par)) {
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

  revalidatePath(`/admin/rounds?eventId=${eventId}`);
  return { ok: true, error: "" };
}
