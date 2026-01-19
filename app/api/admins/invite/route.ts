import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    eventId?: string;
    email?: string;
    role?: string;
  };

  const email = body.email?.trim();
  if (!body.eventId || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const normalizedRole = body.role === "owner" ? "owner" : "admin";

  const { data: adminRow } = await supabaseAdmin
    .from("event_admins")
    .select("user_id")
    .eq("event_id", body.eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const { data: invite, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${origin}/auth/callback` }
  );

  if (error || !invite.user) {
    return NextResponse.json({ error: "Unable to invite user" }, { status: 500 });
  }

  await supabaseAdmin.from("event_admins").upsert({
    event_id: body.eventId,
    user_id: invite.user.id,
    role: normalizedRole
  });

  return NextResponse.json({ userId: invite.user.id });
}
