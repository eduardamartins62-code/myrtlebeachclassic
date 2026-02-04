"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type UpdateAssignmentsInput = {
  eventId: string;
  playerId: string;
  roundIds: string[];
};

export async function updatePlayerAssignments({
  eventId,
  playerId,
  roundIds
}: UpdateAssignmentsInput) {
  if (!eventId || !playerId) {
    return { ok: false, error: "Missing event or player id." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: roundsData, error: roundsError } = await supabaseAdmin
    .from("rounds")
    .select("id")
    .eq("event_id", eventId);

  if (roundsError) {
    return { ok: false, error: roundsError.message };
  }

  const roundIdsForEvent = (roundsData ?? []).map((round) => round.id);

  if (roundIdsForEvent.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from("round_players")
      .delete()
      .eq("player_id", playerId)
      .in("round_id", roundIdsForEvent);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }
  }

  if (roundIds.length > 0) {
    const payload = roundIds.map((roundId) => ({
      round_id: roundId,
      player_id: playerId
    }));
    const { error: insertError } = await supabaseAdmin
      .from("round_players")
      .insert(payload);

    if (insertError) {
      return { ok: false, error: insertError.message };
    }
  }

  revalidatePath(`/admin/events/${eventId}/players`);
  return { ok: true, error: "" };
}
