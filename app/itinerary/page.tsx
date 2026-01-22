import Link from "next/link";
import SiteNav from "@/app/components/SiteNav";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/supabase";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];
type ItineraryItem = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  address: string | null;
  website_url: string | null;
  day_label: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number | null;
};

type GroupedDay = {
  label: string;
  categories: Record<string, ItineraryItem[]>;
};

const categoryLabels: Record<string, string> = {
  HOTEL: "Hotel",
  GOLF: "Golf",
  RESTAURANT: "Restaurants Nearby",
  NIGHTLIFE: "Nightlife & Bars",
  OTHER: "Other Activities"
};

const formatDateRange = (rounds: RoundRow[]) => {
  const dates = rounds
    .map((round) => (round.date ? new Date(round.date) : null))
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return "Dates TBD";
  const start = dates[0].toLocaleDateString();
  const end = dates[dates.length - 1].toLocaleDateString();
  return start === end ? start : `${start} – ${end}`;
};

export default async function ItineraryPage() {
  const supabase = createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", EVENT_SLUG)
    .maybeSingle();

  const { data: rounds } = event
    ? await supabase
        .from("rounds")
        .select("*")
        .eq("event_id", event.id)
        .order("round_number", { ascending: true })
    : { data: [] };

  const { data: itineraryItems } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("is_active", true)
    .order("day_label", { ascending: true })
    .order("sort_order", { ascending: true });

  const items: ItineraryItem[] = (itineraryItems ?? []) as ItineraryItem[];
  const eventName = (event as EventRow | null)?.name ?? EVENT_NAME;
  const dateRange = formatDateRange((rounds ?? []) as RoundRow[]);
  const primaryHotel = items.find(
    (item: ItineraryItem) => item.category === "HOTEL"
  );

  const grouped = items.reduce<Record<string, GroupedDay>>(
    (acc, item: ItineraryItem) => {
      const dayLabel = item.day_label ?? "Trip Highlights";
      if (!acc[dayLabel]) {
        acc[dayLabel] = {
          label: dayLabel,
          categories: {}
        };
      }
      const category = item.category ?? "OTHER";
      if (!acc[dayLabel].categories[category]) {
        acc[dayLabel].categories[category] = [];
      }
      acc[dayLabel].categories[category].push(item);
      return acc;
    },
    {}
  );

  const groupedDays = Object.values(grouped);

  return (
    <main className="min-h-screen bg-white">
      <SiteNav />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10">
        <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
            Itinerary
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {eventName} Trip Details
          </h1>
          <p className="mt-2 text-sm text-slate-600">{dateRange}</p>
          {primaryHotel && (
            <p className="mt-2 text-sm text-slate-600">
              Primary Hotel: {primaryHotel.title}
            </p>
          )}
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Golf &amp; Event Schedule
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Review the full round schedule and course details.
          </p>
          <Link
            className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-pine-600"
            href="/schedule"
          >
            View schedule
          </Link>
        </section>

        {groupedDays.length === 0 && (
          <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No itinerary items have been published yet.
          </section>
        )}

        {groupedDays.map((day) => (
          <section
            key={day.label}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {day.label}
            </h2>
            <div className="mt-4 grid gap-6">
              {Object.entries(day.categories).map(([category, itemsForDay]) => (
                <div key={category} className="grid gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {categoryLabels[category] ?? category}
                  </h3>
                  <div className="grid gap-3">
                    {itemsForDay.map((item: ItineraryItem) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>
                          {item.website_url && (
                            <a
                              className="text-xs font-semibold text-pine-600"
                              href={item.website_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Visit site
                            </a>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm text-slate-600">
                            {item.description}
                          </p>
                        )}
                        {item.address && (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
