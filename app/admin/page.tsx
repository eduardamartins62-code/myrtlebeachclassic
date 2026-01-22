import AdminClient from "./AdminClient";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import type { Database } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

type RoundRow = {
  id: string;
  round_number: number;
  course: string | null;
  date: string | null;
  par: number;
};

type PlayerRow = {
  id: string;
  name: string;
  handicap: number;
  starting_score: number;
};

type ItineraryItemRow = {
  id: string;
  category: string;
  day: string | null;
  name: string;
  description: string | null;
  address: string | null;
  url: string | null;
  sort_order: number | null;
};

type AdminPageProps = {
  searchParams?: { eventId?: string };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: eventsData } = await supabaseAdmin
    .from<EventRow>("events")
    .select("*")
    .order("created_at", { ascending: false });

  const events = eventsData ?? [];
  const eventId = searchParams?.eventId;

  let event: EventRow | null = null;

  if (eventId) {
    const { data: selectedEvent, error: selectedEventError } =
      await supabaseAdmin
        .from<EventRow>("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
    if (selectedEventError) {
      console.error("Failed to load selected event", selectedEventError);
    }
    event = selectedEvent ?? null;
  }

  if (!event) {
    const { data: slugEvent, error: slugEventError } = await supabaseAdmin
      .from<EventRow>("events")
      .select("*")
      .eq("slug", EVENT_SLUG)
      .maybeSingle();
    if (slugEventError) {
      console.error("Failed to load slug event", slugEventError);
    }
    event = slugEvent ?? null;
  }

  if (!event && events.length > 0) {
    event = events[0];
  }

  let players: PlayerRow[] = [];
  let rounds: RoundRow[] = [];
  let itineraryItems: ItineraryItemRow[] = [];
  let showItinerary = false;

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

    players = (playersRes.data as PlayerRow[]) ?? [];
    rounds = (roundsRes.data as RoundRow[]) ?? [];

    const itineraryRes = await supabaseAdmin
      .from("itinerary_items")
      .select(
        "id,category,day,name,description,address,url,sort_order"
      )
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true });

    if (!itineraryRes.error) {
      showItinerary = true;
      itineraryItems = (itineraryRes.data as ItineraryItemRow[]) ?? [];
    }
  }

  return (
    <AdminClient
      event={event}
      initialEvents={events}
      initialPlayers={players}
      initialRounds={rounds}
      initialItineraryItems={itineraryItems}
      showItinerary={showItinerary}
    />
  );
}
