import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type RoundInsert = Database["public"]["Tables"]["rounds"]["Insert"];

export async function POST(request: Request) {
  const body = (await request.json()) as RoundInsert;

  if (!body.event_id || body.round_number === undefined) {
    return NextResponse.json(
      { error: "Event and round number are required." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("rounds")
    .insert({
      event_id: body.event_id,
      round_number: body.round_number,
      course: body.course ?? null,
      date: body.date ?? null,
      par: body.par ?? 72,
      entry_pin: body.entry_pin ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create round." },
      { status: 500 }
    );
  }

  return NextResponse.json({ round: data });
}
