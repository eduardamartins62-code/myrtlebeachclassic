"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/app/components/AdminShell";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import { supabase } from "@/lib/supabaseClient";

const showToastTimeout = 3000;

type EventRow = {
  id: string;
  name: string;
  slug: string;
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

export default function AdminClient() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [playerHandicap, setPlayerHandicap] = useState(0);
  const [playerStartingScore, setPlayerStartingScore] = useState(0);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), showToastTimeout);
  }, []);

  const loadEventData = useCallback(async () => {
    setLoading(true);
    const { data: eventData } = await supabase
      .from("events")
      .select("id,name,slug")
      .eq("slug", EVENT_SLUG)
      .maybeSingle();

    setEvent(eventData ?? null);

    if (!eventData) {
      setRounds([]);
      setPlayers([]);
      setLoading(false);
      return;
    }

    const [roundsRes, playersRes] = await Promise.all([
      supabase
        .from("rounds")
        .select("id,round_number,course,date,par")
        .eq("event_id", eventData.id)
        .order("round_number", { ascending: true }),
      supabase
        .from("players")
        .select("id,name,handicap,starting_score")
        .eq("event_id", eventData.id)
        .order("name", { ascending: true })
    ]);

    setRounds((roundsRes.data ?? []) as RoundRow[]);
    setPlayers((playersRes.data ?? []) as PlayerRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadEventData();
  }, [loadEventData]);

  const handleAddPlayer = async () => {
    if (!event) {
      showToast("No event found.");
      return;
    }
    if (!playerName.trim()) {
      showToast("Enter a player name.");
      return;
    }

    setPlayerLoading(true);
    const { data, error } = await supabase
      .from("players")
      .insert({
        event_id: event.id,
        name: playerName.trim(),
        handicap: playerHandicap,
        starting_score: playerStartingScore
      })
      .select()
      .single();

    if (error || !data) {
      showToast("Failed to add player.");
      setPlayerLoading(false);
      return;
    }

    setPlayers((prev) => [...prev, data]);
    setPlayerName("");
    setPlayerHandicap(0);
    setPlayerStartingScore(0);
    showToast("Player added.");
    setPlayerLoading(false);
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    const confirmed = window.confirm(
      `Delete player ${playerName}? This will remove all of their scores.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("players").delete().eq("id", playerId);

    if (error) {
      showToast("Failed to delete player.");
      return;
    }

    setPlayers((prev) => prev.filter((player) => player.id !== playerId));
    showToast("Player deleted.");
  };

  const roundsByNumber = useMemo(() => rounds, [rounds]);

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">Loading...</div>
      </main>
    );
  }

  return (
    <AdminShell
      title="Myrtle Beach Classic 2026 – Admin"
      description="You are logged in as admin."
    >
      {toast && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {toast}
        </div>
      )}

      {!event && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Event not found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Create the {EVENT_NAME} event in Supabase to manage rounds and
            players.
          </p>
        </section>
      )}

      {event && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Rounds</h2>
              <p className="mt-1 text-sm text-slate-600">
                Manage score entry and round details.
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {roundsByNumber.length}/5 rounds
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {roundsByNumber.map((round) => (
              <div
                key={round.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Round {round.round_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {round.course ?? "Course TBA"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-pine-200 px-3 text-xs font-semibold text-pine-700"
                      href={`/r/${round.id}`}
                    >
                      Leaderboard
                    </Link>
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                      href={`/r/${round.id}/enter`}
                    >
                      Enter Scores
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>{round.date ?? "Date TBA"}</span>
                  <span>Par {round.par}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Players</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add and manage players for the event.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Name
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                value={playerName}
                onChange={(eventItem) => setPlayerName(eventItem.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Handicap
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                max={36}
                min={0}
                type="number"
                value={playerHandicap}
                onChange={(eventItem) =>
                  setPlayerHandicap(
                    Math.max(0, Math.min(36, Number(eventItem.target.value)))
                  )
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Starting Score
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                type="number"
                value={playerStartingScore}
                onChange={(eventItem) =>
                  setPlayerStartingScore(Number(eventItem.target.value))
                }
              />
            </label>
          </div>
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60 sm:w-48"
            disabled={playerLoading || !event}
            onClick={handleAddPlayer}
            type="button"
          >
            {playerLoading ? "Adding..." : "Add Player"}
          </button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Handicap
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Starting Score
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {players.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-4 text-slate-500"
                    colSpan={4}
                  >
                    No players yet. Add the first player above.
                  </td>
                </tr>
              )}
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {player.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {player.handicap}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {player.starting_score}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                      onClick={() =>
                        handleDeletePlayer(player.id, player.name)
                      }
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
