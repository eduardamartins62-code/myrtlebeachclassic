import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request: Request) {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { userId?: string; role?: string };
  const allowedRoles = ["SUPER_ADMIN", "SCORE_KEEPER", "PLAYER"];
  if (!body.userId || !body.role) {
    return NextResponse.json({ error: "Missing user or role." }, { status: 400 });
  }
  if (!allowedRoles.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("profiles").upsert({
    id: body.userId,
    role: body.role,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Unable to update role." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
