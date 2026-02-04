import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];

type AdminEventScoresProps = {
  params: { eventId: string };
};

export default async function AdminEventScoresPage({
  params
}: AdminEventScoresProps) {
  const supabaseAdmin = getSupabaseAdmin();
  const eventId = params.eventId;

  const [{ data: eventData }, { data: roundsData }] = await Promise.all([
    supabaseAdmin.from("events").select("id, name").eq("id", eventId),
    supabaseAdmin
      .from("rounds")
      .select("id, event_id, round_number, course, date")
      .eq("event_id", eventId)
      .order("round_number", { ascending: true })
  ]);

  const event = (eventData ?? [])[0] as EventRow | undefined;
  if (!event) {
    notFound();
  }

  const rounds = (roundsData ?? []) as RoundRow[];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Scores
        </p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {event.name} scoring
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Select a round to enter and review scores.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            href={`/admin/events/${event.id}`}
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {rounds.length === 0 ? (
          <p className="text-base text-slate-600">
            No rounds exist yet for this event.
          </p>
        ) : (
          <div className="space-y-3">
            {rounds.map((round) => (
              <Link
                key={round.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                href={`/admin/events/${event.id}/rounds/${round.id}`}
              >
                <span>
                  Round {round.round_number} • {round.course ?? "Course TBD"}
                </span>
                <span className="text-xs text-slate-500">
                  {round.date
                    ? new Date(round.date).toLocaleDateString()
                    : "Date TBD"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
