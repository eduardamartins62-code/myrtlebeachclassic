import ItineraryAdminClient from "./ItineraryAdminClient";
import { requireSuperAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type ItineraryItem =
  Database["public"]["Tables"]["itinerary_items"]["Row"];

export default async function ItineraryAdminPage() {
  await requireSuperAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const { data } = await supabaseAdmin
    .from("itinerary_items")
    .select("*")
    .order("day_label", { ascending: true })
    .order("sort_order", { ascending: true });

  return <ItineraryAdminClient initialItems={(data ?? []) as ItineraryItem[]} />;
}
