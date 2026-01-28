import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import RoundCreateForm from "./RoundCreateForm";

type EventRow = {
  id: string;
  name: string;
};

type RoundRow = {
  id: string;
  event_id: string;
  round_number: number;
  course_name: string | null;
  date: string | null;
  start_time: string | null;
  par: number | null;
  entry_pin: string | null;
};

type AdminRoundsPageProps = {
  searchParams?: { eventId?: string };
};

export default async function AdminRoundsPage({
  searchParams
}: AdminRoundsPageProps) {
  const eventId = searchParams?.eventId ?? "";
  const supabaseAdmin = getSupabaseAdmin();

  const { data: eventData } = eventId
    ? await supabaseAdmin
        .from("events")
        .select("id, name")
        .eq("id", eventId)
        .single()
    : { data: null };

  const { data: roundsData } = eventId
    ? await supabaseAdmin
        .from("rounds")
        .select(
          "id, event_id, round_number, course_name, date, start_time, par, entry_pin"
        )
        .eq("event_id", eventId)
        .order("round_number", { ascending: true })
    : { data: [] };

  const selectedEvent = eventData as EventRow | null;
  const rounds = (roundsData ?? []) as RoundRow[];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Rounds
        </p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {selectedEvent ? selectedEvent.name : "Select an event"}
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Manage the rounds for the selected event.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            href="/admin/events"
          >
            Back to events
          </Link>
        </div>
      </header>

      {!eventId ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-base text-slate-600">
            Choose an event from the events list to manage its rounds.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Rounds list
              </p>
              <span className="text-xs text-slate-500">
                {rounds.length} total
              </span>
            </div>
            {rounds.length === 0 ? (
              <p className="mt-4 text-base text-slate-600">
                No rounds have been added yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {rounds.map((round) => (
                  <div
                    key={round.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Round {round.round_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {round.date
                          ? new Date(round.date).toLocaleDateString()
                          : "Date TBD"}
                      </p>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Course
                        </dt>
                        <dd>{round.course_name ?? "TBD"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Par
                        </dt>
                        <dd>{round.par ?? "TBD"}</dd>
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Add round</h3>
            <p className="mt-2 text-sm text-slate-600">
              Enter the round details for this event.
            </p>
            <div className="mt-4">
              <RoundCreateForm eventId={eventId} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
