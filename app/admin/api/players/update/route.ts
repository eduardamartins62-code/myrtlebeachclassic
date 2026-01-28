import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type PlayerUpdate = Database["public"]["Tables"]["players"]["Update"] & {
  id: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as PlayerUpdate;

  if (!body.id || !body.name) {
    return NextResponse.json(
      { error: "Player id and name are required." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("players")
    .update({
      name: body.name,
      nickname: body.nickname ?? null,
      image_url: body.image_url ?? null
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to update player." },
      { status: 500 }
    );
  }

  return NextResponse.json({ player: data });
}
