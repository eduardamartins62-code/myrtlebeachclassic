import SiteNav from "@/app/components/SiteNav";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/supabase";

type PastEventRow = Database["public"]["Tables"]["past_events"]["Row"];

export default async function HistoryPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("past_events")
    .select("*")
    .eq("is_published", true)
    .order("year", { ascending: false });

  const events = (data ?? []) as PastEventRow[];

  return (
    <main className="min-h-screen bg-white">
      <SiteNav />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10">
        <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
            History
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Past Myrtle Beach Classics
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Highlights, winners, and stories from prior trips.
          </p>
        </header>

        {events.length === 0 && (
          <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No past events have been published yet.
          </section>
        )}

        <div className="grid gap-6">
          {events.map((event) => (
            <section
              key={event.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {event.year}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    {event.title}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{event.summary}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {event.winner_name && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Winner
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {event.winner_name}
                    </p>
                  </div>
                )}
                {event.runner_up_name && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Runner-up
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {event.runner_up_name}
                    </p>
                  </div>
                )}
                {event.total_players !== null && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Total players
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {event.total_players}
                    </p>
                  </div>
                )}
                {event.notable_courses && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Courses played
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {event.notable_courses}
                    </p>
                  </div>
                )}
                {event.highlight_notes && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Highlight
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {event.highlight_notes}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
