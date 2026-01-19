"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const defaultRoundName = "Myrtle Beach Classic 2026";

type RoundRow = {
  id: string;
  name: string | null;
  round_number: number | null;
  course: string | null;
  date: string | null;
  handicap_enabled: boolean;
  entry_pin: string | null;
};

type PlayerRow = {
  id: string;
  name: string;
  handicap: number;
};

export default function AdminClient() {
  const [round, setRound] = useState<RoundRow | null>(null);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [roundName, setRoundName] = useState(defaultRoundName);
  const [roundNumber, setRoundNumber] = useState(1);
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [entryPin, setEntryPin] = useState("");
  const [roundLoading, setRoundLoading] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerHandicap, setPlayerHandicap] = useState(0);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const leaderboardLink = useMemo(() => {
    if (!round) return null;
    return `/r/${round.id}`;
  }, [round]);

  useEffect(() => {
    const loadRounds = async () => {
      const { data, error } = await supabase
        .from("rounds")
        .select("id,name,round_number,course,date,handicap_enabled,entry_pin")
        .order("round_number", { ascending: true });
      if (error) return;
      setRounds(data ?? []);
    };
    void loadRounds();
  }, []);

  const handleCreateRound = async () => {
    setRoundLoading(true);
    const { data, error } = await supabase
      .from("rounds")
      .insert({
        name: roundName || defaultRoundName,
        round_number: roundNumber,
        course,
        date: date || null,
        handicap_enabled: true,
        entry_pin: entryPin || null
      })
      .select()
      .single();

    if (error) {
      showToast("Failed to create round.");
      setRoundLoading(false);
      return;
    }

    setRound(data);
    setRounds((prev) => [...prev, data]);
    showToast("Round created.");
    setRoundLoading(false);
  };

  const handleAddPlayer = async () => {
    if (!round) {
      showToast("Create a round first.");
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
        round_id: round.id,
        name: playerName,
        handicap: playerHandicap
      })
      .select()
      .single();

    if (error) {
      showToast("Failed to add player.");
      setPlayerLoading(false);
      return;
    }

    setPlayers((prev) => [
      ...prev,
      { id: data.id, name: data.name, handicap: data.handicap ?? 0 }
    ]);
    setPlayerName("");
    setPlayerHandicap(0);
    showToast("Player added.");
    setPlayerLoading(false);
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
          Myrtle Beach Classic 2026
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Admin – Myrtle Beach Classic 2026
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Create rounds, add players, and share the leaderboard link.
        </p>
      </header>

      {toast && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {toast}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create Round</h2>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Round Number
            <select
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={roundNumber}
              onChange={(event) => setRoundNumber(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5].map((number) => (
                <option key={number} value={number}>
                  Round {number}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Round Name
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={roundName}
              onChange={(event) => setRoundName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Course
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Date
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <input checked className="h-4 w-4" disabled type="checkbox" />
            Handicap Enabled (fixed for trip rounds)
          </div>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Entry PIN
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              placeholder="Optional PIN"
              value={entryPin}
              onChange={(event) => setEntryPin(event.target.value)}
            />
          </label>
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={roundLoading}
            onClick={handleCreateRound}
            type="button"
          >
            {roundLoading ? "Creating..." : "Create Round"}
          </button>
        </div>
      </section>

      {rounds.length > 0 && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Rounds</h2>
          <div className="mt-4 grid gap-3">
            {rounds.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Round {item.round_number ?? 1}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.name ?? defaultRoundName}
                    </p>
                  </div>
                  <Link
                    className="text-sm font-semibold text-pine-700"
                    href={`/r/${item.id}`}
                  >
                    View
                  </Link>
                </div>
                {(item.course || item.date) && (
                  <p className="text-xs text-slate-500">
                    {[item.course, item.date].filter(Boolean).join(" • ")}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Entry: /r/{item.id}/enter</span>
                  <span>PIN {item.entry_pin ? "enabled" : "open"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add Players</h2>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Player Name
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Handicap (0-36)
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              max={36}
              min={0}
              type="number"
              value={playerHandicap}
              onChange={(event) =>
                setPlayerHandicap(
                  Math.max(0, Math.min(36, Number(event.target.value)))
                )
              }
            />
          </label>
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={playerLoading}
            onClick={handleAddPlayer}
            type="button"
          >
            {playerLoading ? "Adding..." : "Add Player"}
          </button>
        </div>

        {players.length > 0 && (
          <div className="mt-4 grid gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm"
              >
                <span className="font-semibold text-slate-900">
                  {player.name}
                </span>
                <span className="text-slate-500">Handicap {player.handicap}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {leaderboardLink && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Share Link</h2>
          <p className="mt-2 text-sm text-slate-600">
            Share this link with players to view the live leaderboard.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <code className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {leaderboardLink}
            </code>
            <Link
              className="h-12 rounded-2xl border border-pine-200 bg-white text-center text-base font-semibold text-pine-700 shadow-sm"
              href={leaderboardLink}
            >
              Open Leaderboard
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
