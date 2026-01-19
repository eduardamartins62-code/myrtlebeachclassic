import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; year?: number };
  const eventName = body.name?.trim();

  if (!eventName) {
    return NextResponse.json({ error: "Missing event name" }, { status: 400 });
  }

  const { data: existingEvent } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("name", eventName)
    .maybeSingle();

  let eventId = existingEvent?.id;

  if (!eventId) {
    const { data: createdEvent, error } = await supabaseAdmin
      .from("events")
      .insert({
        name: eventName,
        year: body.year ?? null
      })
      .select("id")
      .single();

    if (error || !createdEvent) {
      return NextResponse.json({ error: "Unable to create event" }, { status: 500 });
    }

    eventId = createdEvent.id;
  }

  if (!existingEvent) {
    await supabaseAdmin.from("admins").upsert({
      event_id: eventId,
      user_id: user.id,
      role: "owner"
    });
  } else {
    const { data: adminRow } = await supabaseAdmin
      .from("admins")
      .select("user_id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!adminRow) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ eventId });
}
