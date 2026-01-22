import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const { user, role } = await getCurrentUserWithRole();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();
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
