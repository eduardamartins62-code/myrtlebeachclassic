import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

type AdminEventDashboardProps = {
  params: { eventId: string };
};

export default async function AdminEventDashboard({
  params
}: AdminEventDashboardProps) {
  const supabaseAdmin = getSupabaseAdmin();
  const eventId = params.eventId;

  const [{ data: eventData }, { data: roundsData }, { data: playersData }] =
    await Promise.all([
      supabaseAdmin.from("events").select("id, name, slug").eq("id", eventId),
      supabaseAdmin
        .from("rounds")
        .select("id, event_id, round_number, course, date, par, entry_pin")
        .eq("event_id", eventId)
        .order("round_number", { ascending: true }),
      supabaseAdmin
        .from("players")
        .select("id, event_id, name")
        .eq("event_id", eventId)
        .order("name", { ascending: true })
    ]);

  const event = (eventData ?? [])[0] as EventRow | undefined;
  if (!event) {
    notFound();
  }

  const rounds = (roundsData ?? []) as RoundRow[];
  const players = (playersData ?? []) as PlayerRow[];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Event dashboard
        </p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {event.name}
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Manage rounds, players, and scoring for this event.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            href="/admin/events"
          >
            Back to events
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            href={`/admin/events/${event.id}/players`}
          >
            Players ({players.length})
          </Link>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            href={`/admin/events/${event.id}/scores`}
          >
            Scores
          </Link>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Rounds for {event.slug}
          </p>
          <span className="text-xs text-slate-500">{rounds.length} total</span>
        </div>
        {rounds.length === 0 ? (
          <p className="mt-4 text-base text-slate-600">
            No rounds have been created yet. Add a round from the Rounds
            section.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Round {round.round_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {round.course ?? "Course TBD"} •{" "}
                      {round.date
                        ? new Date(round.date).toLocaleDateString()
                        : "Date TBD"}
                    </p>
                  </div>
                  <Link
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    href={`/admin/events/${event.id}/rounds/${round.id}`}
                  >
                    Enter scores
                  </Link>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Par
                    </dt>
                    <dd>{round.par}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Entry pin
                    </dt>
                    <dd>{round.entry_pin ?? "—"}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
