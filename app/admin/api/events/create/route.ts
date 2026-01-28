import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

export async function POST(request: Request) {
  const body = (await request.json()) as EventInsert;

  if (!body.name || !body.slug) {
    return NextResponse.json(
      { error: "Event name and slug are required." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({ name: body.name, slug: body.slug })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create event." },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: data });
}
