import AdminClient from "./AdminClient";
import { EVENT_SLUG } from "@/lib/event";
import { requireSuperAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

type AdminPageProps = {
  searchParams?: { eventId?: string };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireSuperAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: eventsData } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const events = eventsData ?? [];
  const eventId = searchParams?.eventId;

  let event: EventRow | null = null;

  if (eventId) {
    const { data: selectedEvent } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();
    event = selectedEvent ?? null;
  }

  if (!event) {
    const { data: slugEvent } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("slug", EVENT_SLUG)
      .maybeSingle();
    event = slugEvent ?? null;
  }

  if (!event && events.length > 0) {
    event = events[0];
  }

  let players: PlayerRow[] = [];
  let rounds: RoundRow[] = [];

  if (event) {
    const [playersRes, roundsRes] = await Promise.all([
      supabaseAdmin
        .from("players")
        .select("id,name,handicap,starting_score")
        .eq("event_id", event.id)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("rounds")
        .select("id,round_number,course,date,par")
        .eq("event_id", event.id)
        .order("round_number", { ascending: true })
    ]);

    players = playersRes.data ?? [];
    rounds = roundsRes.data ?? [];
  }

  return (
    <AdminClient
      event={event}
      initialEvents={events}
      initialPlayers={players}
      initialRounds={rounds}
    />
  );
}
