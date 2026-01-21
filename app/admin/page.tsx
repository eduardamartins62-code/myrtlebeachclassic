import AdminClient from "./AdminClient";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type EventRow = {
  id: string;
  name: string;
  slug?: string | null;
  location?: string | null;
};

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

const getLatestEvent = async (supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) => {
  const latestByCreated = await supabaseAdmin
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestByCreated.error && latestByCreated.data) {
    return latestByCreated.data as EventRow;
  }

  const fallback = await supabaseAdmin
    .from("events")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (fallback.data as EventRow) ?? null;
};

export default async function AdminPage() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: slugEvent } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("slug", EVENT_SLUG)
    .maybeSingle();

  let event = (slugEvent as EventRow | null) ?? (await getLatestEvent(supabaseAdmin));

  if (!event) {
    const { data: createdEvent } = await supabaseAdmin
      .from("events")
      .insert({ name: EVENT_NAME, slug: EVENT_SLUG })
      .select("*")
      .single();
    event = (createdEvent as EventRow | null) ?? null;
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
      initialPlayers={players}
      initialRounds={rounds}
      initialItineraryItems={itineraryItems}
      showItinerary={showItinerary}
    />
  );
}
