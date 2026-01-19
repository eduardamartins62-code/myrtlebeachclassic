import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  const { data: adminCheck } = await supabaseAdmin
    .from("event_admins")
    .select("user_id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: adminRows, error } = await supabaseAdmin
    .from("event_admins")
    .select("user_id,role")
    .eq("event_id", eventId)
    .order("role", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load admins" }, { status: 500 });
  }

  const adminIds = adminRows?.map((row) => row.user_id) ?? [];

  const { data: usersData } = await supabaseAdmin
    .from("auth.users")
    .select("id,email")
    .in("id", adminIds);

  const emailsById = new Map(
    (usersData ?? []).map((userRow) => [userRow.id, userRow.email ?? ""])
  );

  const admins = (adminRows ?? []).map((row) => ({
    user_id: row.user_id,
    role: row.role,
    email: emailsById.get(row.user_id) ?? ""
  }));

  return NextResponse.json({ admins });
}
