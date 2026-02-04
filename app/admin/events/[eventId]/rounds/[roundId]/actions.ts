"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ScoreUpdateInput = {
  eventId: string;
  roundId: string;
  playerId: string;
  holeNumber: number;
  strokes: number | null;
};

type HoleParUpdateInput = {
  eventId: string;
  roundId: string;
  holeNumber: number;
  par: number;
};

export async function updateScore({
  eventId,
  roundId,
  playerId,
  holeNumber,
  strokes
}: ScoreUpdateInput) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!roundId || !playerId || !holeNumber) {
    return { ok: false, error: "Missing round, player, or hole." };
  }

  if (strokes === null) {
    const { error } = await supabaseAdmin
      .from("scores")
      .delete()
      .eq("round_id", roundId)
      .eq("player_id", playerId)
      .eq("hole_number", holeNumber);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabaseAdmin.from("scores").upsert(
      {
        round_id: roundId,
        player_id: playerId,
        hole_number: holeNumber,
        strokes
      },
      { onConflict: "round_id,player_id,hole_number" }
    );

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath(`/admin/events/${eventId}/rounds/${roundId}`);
  return { ok: true, error: "" };
}

export async function updateHolePar({
  eventId,
  roundId,
  holeNumber,
  par
}: HoleParUpdateInput) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!roundId || !holeNumber) {
    return { ok: false, error: "Missing round or hole." };
  }

  const { error } = await supabaseAdmin.from("round_holes").upsert(
    {
      round_id: roundId,
      hole_number: holeNumber,
      par
    },
    { onConflict: "round_id,hole_number" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/events/${eventId}/rounds/${roundId}`);
  return { ok: true, error: "" };
}
