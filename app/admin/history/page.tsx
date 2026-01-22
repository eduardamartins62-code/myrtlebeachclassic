import HistoryAdminClient from "./HistoryAdminClient";
import { requireSuperAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type PastEventRow = Database["public"]["Tables"]["past_events"]["Row"];

export default async function HistoryAdminPage() {
  await requireSuperAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const { data } = await supabaseAdmin
    .from("past_events")
    .select("*")
    .order("year", { ascending: false });

  return <HistoryAdminClient initialEvents={(data ?? []) as PastEventRow[]} />;
}
