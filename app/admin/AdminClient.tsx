"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/app/components/AdminShell";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import { supabase } from "@/lib/supabaseClient";

const emptyPlayerForm = {
  name: "",
  handicap: 0,
  starting_score: 0
};

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
  const [playerForm, setPlayerForm] = useState(emptyPlayerForm);
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

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

  const handleCreateEvent = async () => {
    setEventLoading(true);
    const response = await fetch("/api/events/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: EVENT_NAME, slug: EVENT_SLUG })
    });

    if (!response.ok) {
      showToast("Failed to create event.");
      setEventLoading(false);
      return;
    }

    showToast("Event created.");
    setEventLoading(false);
    void loadEventData();
  };

  const handleAddPlayer = async () => {
    if (!event) {
      showToast("Create the event first.");
      return;
    }
    if (!playerForm.name.trim()) {
      showToast("Enter a player name.");
      return;
    }

    setPlayerLoading(true);
    const { data, error } = await supabase
      .from("players")
      .insert({
        event_id: event.id,
        name: playerForm.name.trim(),
        handicap: playerForm.handicap,
        starting_score: playerForm.starting_score
      })
      .select()
      .single();

    if (error || !data) {
      showToast("Failed to add player.");
      setPlayerLoading(false);
      return;
    }

    setPlayers((prev) => [...prev, data]);
    setPlayerForm(emptyPlayerForm);
    showToast("Player added.");
    setPlayerLoading(false);
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    const confirmed = window.confirm(
      `Delete player ${playerName}? This will also remove all of their scores.`
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

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  };

  const formatDate = (value: string | null) => {
    if (!value) return "TBD";
    return new Date(value).toLocaleDateString();
  };

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
      subtitle="Admin Portal"
      description="Manage players, rounds, and score entry."
      actions={
        <button
          className="h-10 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          onClick={handleLogout}
          type="button"
        >
          Log out
        </button>
      }
    >
      {toast && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {toast}
        </div>
      )}

      {!event && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Event Setup</h2>
          <p className="mt-2 text-sm text-slate-600">
            Create the {EVENT_NAME} event before adding rounds or players.
          </p>
          <button
            className="mt-4 h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={eventLoading}
            onClick={handleCreateEvent}
            type="button"
          >
            {eventLoading ? "Creating..." : "Create Event"}
          </button>
        </section>
      )}

      {event && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Players Management
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Add or remove players for the event.
          </p>

          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Name
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                value={playerForm.name}
                onChange={(eventItem) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    name: eventItem.target.value
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Handicap
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                max={36}
                min={0}
                type="number"
                value={playerForm.handicap}
                onChange={(eventItem) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    handicap: Math.max(
                      0,
                      Math.min(36, Number(eventItem.target.value))
                    )
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Starting Score
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                type="number"
                value={playerForm.starting_score}
                onChange={(eventItem) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    starting_score: Number(eventItem.target.value)
                  }))
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

          {players.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <th className="py-3 pr-3">Name</th>
                    <th className="py-3 pr-3">Handicap</th>
                    <th className="py-3 pr-3">Starting</th>
                    <th className="py-3" />
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-slate-100">
                      <td className="py-3 pr-3 font-semibold text-slate-900">
                        {player.name}
                      </td>
                      <td className="py-3 pr-3">{player.handicap}</td>
                      <td className="py-3 pr-3">{player.starting_score}</td>
                      <td className="py-3 text-right">
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
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No players yet. Add players above.
            </p>
          )}
        </section>
      )}

      {event && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Rounds Overview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick links for each round.
          </p>
          {rounds.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <th className="py-3 pr-3">Round</th>
                    <th className="py-3 pr-3">Course</th>
                    <th className="py-3 pr-3">Date</th>
                    <th className="py-3 pr-3">Par</th>
                    <th className="py-3 text-right">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round) => (
                    <tr key={round.id} className="border-b border-slate-100">
                      <td className="py-3 pr-3 font-semibold text-slate-900">
                        Round {round.round_number}
                      </td>
                      <td className="py-3 pr-3">{round.course ?? "TBD"}</td>
                      <td className="py-3 pr-3">{formatDate(round.date)}</td>
                      <td className="py-3 pr-3">{round.par}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No rounds yet. Add rounds in Supabase to activate leaderboards.
            </p>
          )}
        </section>
      )}
    </AdminShell>
  );
}
