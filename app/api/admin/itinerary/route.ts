import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type ItineraryInsert =
  Database["public"]["Tables"]["itinerary_items"]["Insert"];
type ItineraryUpdate =
  Database["public"]["Tables"]["itinerary_items"]["Update"];

const requireSuperAdmin = async () => {
  const { user, role } = await getCurrentUserWithRole();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
};

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth) return auth;

  const body = (await request.json()) as ItineraryInsert;
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("itinerary_items")
    .insert({
      ...body,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create item." },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth) return auth;

  const body = (await request.json()) as ItineraryUpdate & { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Missing item id." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("itinerary_items")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to update item." },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth) return auth;

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Missing item id." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("itinerary_items")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Unable to delete item." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
