import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];

export async function POST(request: Request) {
  const body = (await request.json()) as PlayerInsert;

  if (!body.event_id || !body.name) {
    return NextResponse.json(
      { error: "Event and player name are required." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("players")
    .insert({
      event_id: body.event_id,
      name: body.name,
      nickname: body.nickname ?? null,
      image_url: body.image_url ?? null,
      handicap: body.handicap ?? 0,
      starting_score: body.starting_score ?? 0
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create player." },
      { status: 500 }
    );
  }

  return NextResponse.json({ player: data });
}
