import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import PlayerCreateForm from "./PlayerCreateForm";
import PlayerEditCard from "./PlayerEditCard";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

type AdminEventPlayersProps = {
  params: { eventId: string };
};

export default async function AdminEventPlayersPage({
  params
}: AdminEventPlayersProps) {
  const supabaseAdmin = getSupabaseAdmin();
  const eventId = params.eventId;

  const [
    { data: eventData },
    { data: playersData, error: playersError }
  ] = await Promise.all([
    supabaseAdmin.from("events").select("id, name").eq("id", eventId),
    supabaseAdmin
      .from("players")
      .select(
        "id, event_id, name, nickname, image_url, handicap, starting_score, created_at"
      )
      .eq("event_id", eventId)
      .order("name", { ascending: true })
  ]);

  const event = (eventData ?? [])[0] as EventRow | undefined;
  if (!event) {
    notFound();
  }

  const players = (playersData ?? []) as PlayerRow[];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Players
        </p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {event.name} roster
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Manage avatars, handicaps, and starting scores.
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Player roster
            </p>
            <span className="text-xs text-slate-500">
              {players.length} total
            </span>
          </div>
          {playersError ? (
            <p className="mt-4 text-sm text-rose-500">
              Unable to load players: {playersError.message}
            </p>
          ) : null}
          {players.length === 0 ? (
            <p className="mt-4 text-base text-slate-600">
              No players have been added yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {players.map((player) => (
                <PlayerEditCard
                  key={player.id}
                  player={player}
                />
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Add player
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Create a new player for this event roster.
          </p>
          <div className="mt-4">
            <PlayerCreateForm eventId={event.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
