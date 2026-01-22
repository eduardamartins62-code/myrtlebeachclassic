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
    return NextResponse.json(
      { error: "Missing event name or slug" },
      { status: 400 }
    );
  }

  const { data: existingEvent } = await supabaseAdmin
    .from("events")
    .select("id,name,slug,created_at")
    .eq("slug", eventSlug)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ event: existingEvent });
  }

  const { data: createdEvent, error } = await supabaseAdmin
    .from("events")
    .insert({
      name: eventName,
      slug: eventSlug
    })
    .select("id,name,slug,created_at")
    .single();

  if (error || !createdEvent) {
    return NextResponse.json(
      { error: "Unable to create event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: createdEvent });
}
