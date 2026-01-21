import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_COOKIE_NAME = "mbc_admin";

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const adminCookie = cookies().get(ADMIN_COOKIE_NAME)?.value;

  if (adminCookie !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; slug?: string };
  const eventName = body.name?.trim();
  const eventSlug = body.slug?.trim();

  if (!eventName || !eventSlug) {
    return NextResponse.json({ error: "Missing event name" }, { status: 400 });
  }

  const { data: existingEvent } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", eventSlug)
    .maybeSingle();

  let eventId = existingEvent?.id;

  if (!eventId) {
    const { data: createdEvent, error } = await supabaseAdmin
      .from("events")
      .insert({
        name: eventName,
        slug: eventSlug
      })
      .select("id")
      .single();

    if (error || !createdEvent) {
      return NextResponse.json({ error: "Unable to create event" }, { status: 500 });
    }

    eventId = createdEvent.id;
  }

  return NextResponse.json({ eventId });
}
