import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";
import { deleteItineraryItem } from "./actions";
import EventSelector from "./EventSelector";
import ItineraryCreateForm from "./ItineraryCreateForm";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
type ItineraryItem = ItineraryRow;

type AdminItineraryPageProps = {
  searchParams?: { eventId?: string };
};

type GroupedDay = {
  label: string;
  items: ItineraryItem[];
};

const CATEGORY_OPTIONS = ["HOTEL", "GOLF", "FOOD", "NIGHTLIFE", "OTHER"];
const itineraryColumns = [
  "id",
  "category",
  "title",
  "description",
  "address",
  "website_url",
  "start_time",
  "end_time",
  "day_label",
  "sort_order",
  "is_active",
  "created_at",
  "updated_at"
] as const;

const getMissingColumns = () => {
  const expectedColumns = ["event_id", "map_url", "display_order"];
  return expectedColumns.filter(
    (column) => !itineraryColumns.includes(column as (typeof itineraryColumns)[number])
  );
};

const groupItems = (items: ItineraryItem[]) => {
  const grouped = items.reduce<Record<string, GroupedDay>>((acc, item) => {
    const dayLabel = item.day_label ?? "Trip Highlights";
    if (!acc[dayLabel]) {
      acc[dayLabel] = { label: dayLabel, items: [] };
    }
    acc[dayLabel].items.push(item);
    return acc;
  }, {});

  return Object.values(grouped).map((group) => {
    const sortedItems = [...group.items].sort((a, b) => {
      if (a.sort_order !== null || b.sort_order !== null) {
        return (a.sort_order ?? Number.MAX_SAFE_INTEGER) -
          (b.sort_order ?? Number.MAX_SAFE_INTEGER);
      }
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      return a.title.localeCompare(b.title);
    });
    return { ...group, items: sortedItems };
  });
};

export default async function AdminItineraryPage({
  searchParams
}: AdminItineraryPageProps) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: eventsData } = await supabaseAdmin
    .from("events")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  const events = (eventsData ?? []) as EventRow[];
  const defaultEventId = events[0]?.id ?? "";
  const requestedEventId = searchParams?.eventId ?? "";
  const selectedEventId =
    events.find((event) => event.id === requestedEventId)?.id ?? defaultEventId;
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  const missingColumns = getMissingColumns();
  if (missingColumns.length > 0) {
    console.warn(
      `itinerary_items schema missing columns: ${missingColumns.join(", ")}`
    );
  }

  const itineraryQuery = supabaseAdmin
    .from("itinerary_items")
    .select(
      "id, category, title, description, address, website_url, day_label, sort_order, is_active, created_at"
    )
    .order("day_label", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: itineraryData, error: itineraryError } = await itineraryQuery;
  const items = (itineraryData ?? []) as ItineraryItem[];
  const groupedDays = groupItems(items);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Itinerary
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Itinerary management
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Manage schedules, travel, and hospitality for each event.
        </p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Event
        </p>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No events are available yet.
          </p>
        ) : (
          <div className="mt-3 max-w-sm">
            <EventSelector events={events} selectedEventId={selectedEventId} />
          </div>
        )}
        {selectedEvent ? (
          <p className="mt-3 text-sm text-slate-600">
            Viewing itinerary for <span className="font-semibold">{selectedEvent.name}</span>.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Itinerary items
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {items.length} item{items.length === 1 ? "" : "s"} total
              </p>
            </div>
          </div>

          {itineraryError ? (
            <p className="mt-4 text-sm text-rose-500">
              Unable to load itinerary items: {itineraryError.message}
            </p>
          ) : null}

          {items.length === 0 ? (
            <p className="mt-6 text-base text-slate-600">
              No itinerary items have been added yet.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {groupedDays.map((group) => (
                <div key={group.label} className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {group.label}
                  </h3>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                              {item.category || "OTHER"}
                            </span>
                            <h4 className="mt-2 text-base font-semibold text-slate-900">
                              {item.title}
                            </h4>
                            {item.description ? (
                              <p className="mt-1 text-sm text-slate-600">
                                {item.description}
                              </p>
                            ) : null}
                            {item.address ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.address}
                              </p>
                            ) : null}
                            {item.website_url ? (
                              <a
                                className="mt-2 inline-flex text-xs font-semibold text-pine-600"
                                href={item.website_url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                External link
                              </a>
                            ) : null}
                          </div>
                          <form action={deleteItineraryItem}>
                            <input name="id" type="hidden" value={item.id} />
                            <input
                              name="event_id"
                              type="hidden"
                              value={selectedEventId}
                            />
                            <button
                              className="text-xs font-semibold text-rose-500 transition hover:text-rose-600"
                              type="submit"
                            >
                              Remove
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Create item</h3>
          <p className="mt-2 text-sm text-slate-600">
            Add lodging, dining, and hospitality details for this event.
          </p>
          <div className="mt-4">
            <ItineraryCreateForm
              categoryOptions={CATEGORY_OPTIONS}
              eventId={selectedEventId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
