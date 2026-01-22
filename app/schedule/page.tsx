import Link from "next/link";
import SiteNav from "@/app/components/SiteNav";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/supabase";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];

const formatDate = (value: string | null) => {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString();
};

export default async function SchedulePage() {
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

  const eventName = event?.name ?? EVENT_NAME;

  return (
    <main className="min-h-screen bg-white">
      <SiteNav />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10">
        <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
            Schedule
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {eventName} Tee Sheet
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Round-by-round itinerary for the week in Myrtle Beach.
          </p>
        </header>

        <section className="grid gap-4">
          {(rounds as RoundRow[]).length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
              No rounds scheduled yet. Check back soon.
            </div>
          )}
          {(rounds as RoundRow[]).map((round) => (
            <div
              key={round.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Round {round.round_number}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    {round.course ?? "Course TBD"}
                  </h2>
                </div>
                <Link
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-pine-600"
                  href={`/r/${round.id}`}
                >
                  View leaderboard
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDate(round.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Tee time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Sunrise roll-out
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Par
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {round.par}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
