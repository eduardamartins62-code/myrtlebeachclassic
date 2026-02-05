import type { Database } from "@/types/supabase";
import { EVENT_SLUG } from "@/lib/event";
import { getSupabaseServer } from "@/lib/supabaseServer";
import HomePageClient from "./HomePageClient";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export default async function HomePage() {
  const supabase = getSupabaseServer();
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("slug", EVENT_SLUG)
    .maybeSingle();

  const event = (eventData ?? null) as EventRow | null;

  return <HomePageClient initialEvent={event} />;
}
