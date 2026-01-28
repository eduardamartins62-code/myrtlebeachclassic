import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";
import PlayerCreateForm from "./PlayerCreateForm";
import PlayerEditForm from "./PlayerEditForm";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

export default async function AdminPlayersPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: eventsData }, { data: playersData, error }] =
    await Promise.all([
      supabaseAdmin.from("events").select("id, name").order("name"),
      supabaseAdmin
        .from("players")
        .select(
          "id, event_id, name, nickname, image_url, handicap, starting_score, created_at"
        )
        .order("name", { ascending: true })
    ]);

  const events = (eventsData ?? []) as EventRow[];
  const players = (playersData ?? []) as PlayerRow[];
  const eventMap = new Map(events.map((event) => [event.id, event.name]));

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Players
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Player management
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Add players for each event and keep names, nicknames, and avatar URLs
          up to date.
        </p>
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
          {error ? (
            <p className="mt-4 text-sm text-rose-500">
              Unable to load players: {error.message}
            </p>
          ) : null}
          {players.length === 0 ? (
            <p className="mt-4 text-base text-slate-600">
              No players have been added yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                          {player.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={player.name}
                              className="h-full w-full object-cover"
                              src={player.image_url}
                            />
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              N/A
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {player.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {player.nickname ?? "No nickname"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {eventMap.get(player.event_id) ?? "Unknown event"}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        Added {new Date(player.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <PlayerEditForm player={player} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Create player
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Add a new player to an event roster.
          </p>
          <div className="mt-4">
            <PlayerCreateForm events={events} />
          </div>
        </div>
      </div>
    </section>
  );
}
