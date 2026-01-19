"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const defaultEventName = "Myrtle Beach Classic 2026";
const defaultEventYear = 2026;

const emptyRound = {
  name: defaultEventName,
  round_number: 1,
  course: "",
  date: "",
  course_par: 72,
  entry_pin: ""
};

type EventRow = {
  id: string;
  name: string;
  year: number | null;
};

type RoundRow = {
  id: string;
  name: string | null;
  round_number: number;
  course: string | null;
  date: string | null;
  course_par: number;
  handicap_enabled: boolean;
  entry_pin: string | null;
};

type PlayerRow = {
  id: string;
  name: string;
  handicap: number;
  starting_score: number;
};

type AdminRow = {
  user_id: string;
  role: string;
};

export default function AdminClient() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [roundForm, setRoundForm] = useState(emptyRound);
  const [roundLoading, setRoundLoading] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerHandicap, setPlayerHandicap] = useState(0);
  const [playerStartingScore, setPlayerStartingScore] = useState(0);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadEventData = useCallback(async () => {
    const { data: eventData } = await supabase
      .from("events")
      .select("id,name,year")
      .eq("name", defaultEventName)
      .maybeSingle();

    setEvent(eventData ?? null);

    if (!eventData) {
      setRounds([]);
      setPlayers([]);
      setAdmins([]);
      return;
    }

    const [roundsRes, playersRes, adminsRes, userRes] = await Promise.all([
      supabase
        .from("rounds")
        .select(
          "id,name,round_number,course,date,course_par,handicap_enabled,entry_pin"
        )
        .eq("event_id", eventData.id)
        .order("round_number", { ascending: true }),
      supabase
        .from("players")
        .select("id,name,handicap,starting_score")
        .eq("event_id", eventData.id)
        .order("name", { ascending: true }),
      supabase
        .from("admins")
        .select("user_id,role")
        .eq("event_id", eventData.id)
        .order("role", { ascending: false }),
      supabase.auth.getUser()
    ]);

    setRounds((roundsRes.data ?? []) as RoundRow[]);
    setPlayers((playersRes.data ?? []) as PlayerRow[]);
    setAdmins((adminsRes.data ?? []) as AdminRow[]);

    const user = userRes.data.user;
    setUserId(user?.id ?? null);
    setIsAdmin(
      Boolean(
        user &&
          (adminsRes.data ?? []).some((admin) => admin.user_id === user.id)
      )
    );
  }, []);

  useEffect(() => {
    void loadEventData();
  }, [loadEventData]);

  const leaderboardLink = useMemo(() => {
    if (rounds.length === 0) return null;
    return rounds.map((round) => ({
      id: round.id,
      label: `Round ${round.round_number}`,
      leaderboard: `/r/${round.id}`,
      entry: `/r/${round.id}/enter`
    }));
  }, [rounds]);

  const handleCreateEvent = async () => {
    setEventLoading(true);
    const response = await fetch("/api/events/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: defaultEventName,
        year: defaultEventYear
      })
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

  const handleCreateRound = async () => {
    if (!event) {
      showToast("Create the event first.");
      return;
    }
    setRoundLoading(true);
    const { data, error } = await supabase
      .from("rounds")
      .insert({
        event_id: event.id,
        name: roundForm.name || defaultEventName,
        round_number: roundForm.round_number,
        course: roundForm.course,
        date: roundForm.date || null,
        course_par: roundForm.course_par,
        handicap_enabled: true,
        entry_pin: roundForm.entry_pin || null
      })
      .select()
      .single();

    if (error) {
      showToast("Failed to create round.");
      setRoundLoading(false);
      return;
    }

    setRounds((prev) => [...prev, data]);
    setRoundForm(emptyRound);
    showToast("Round created.");
    setRoundLoading(false);
  };

  const handleAddPlayer = async () => {
    if (!event) {
      showToast("Create the event first.");
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
        name: playerName,
        handicap: playerHandicap,
        starting_score: playerStartingScore
      })
      .select()
      .single();

    if (error) {
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

  const handleInviteAdmin = async () => {
    if (!event) return;
    if (!inviteEmail.trim()) {
      showToast("Enter an email address.");
      return;
    }
    setInviteLoading(true);
    const response = await fetch("/api/admins/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventId: event.id,
        email: inviteEmail.trim(),
        role: inviteRole
      })
    });

    if (!response.ok) {
      showToast("Failed to invite admin.");
      setInviteLoading(false);
      return;
    }

    showToast("Admin invited.");
    setInviteEmail("");
    setInviteLoading(false);
    void loadEventData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (event && !isAdmin && userId) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
        <header className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You are logged in but not listed as an admin for this event.
          </p>
          <button
            className="mt-4 h-11 rounded-2xl bg-pine-600 px-4 text-sm font-semibold text-white"
            onClick={handleSignOut}
            type="button"
          >
            Sign out
          </button>
        </header>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
              {defaultEventName}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Admin – {defaultEventName}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Create rounds, add players, and manage admins.
            </p>
          </div>
          <button
            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
            onClick={handleSignOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>

      {toast && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {toast}
        </div>
      )}

      {!event && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Event Setup
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Create the Myrtle Beach Classic 2026 event before adding rounds or
            players.
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

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create Round</h2>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Round Number
            <select
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={roundForm.round_number}
              onChange={(eventItem) =>
                setRoundForm((prev) => ({
                  ...prev,
                  round_number: Number(eventItem.target.value)
                }))
              }
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
              value={roundForm.name}
              onChange={(eventItem) =>
                setRoundForm((prev) => ({
                  ...prev,
                  name: eventItem.target.value
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Course
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={roundForm.course}
              onChange={(eventItem) =>
                setRoundForm((prev) => ({
                  ...prev,
                  course: eventItem.target.value
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Date
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              type="date"
              value={roundForm.date}
              onChange={(eventItem) =>
                setRoundForm((prev) => ({
                  ...prev,
                  date: eventItem.target.value
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Course Par
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              type="number"
              min={60}
              max={80}
              value={roundForm.course_par}
              onChange={(eventItem) =>
                setRoundForm((prev) => ({
                  ...prev,
                  course_par: Number(eventItem.target.value)
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Entry PIN
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              placeholder="Optional PIN"
              value={roundForm.entry_pin}
              onChange={(eventItem) =>
                setRoundForm((prev) => ({
                  ...prev,
                  entry_pin: eventItem.target.value
                }))
              }
            />
          </label>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <input checked className="h-4 w-4" disabled type="checkbox" />
            Handicap Enabled (fixed for trip rounds)
          </div>
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={roundLoading || !event}
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
                      Round {item.round_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.name ?? defaultEventName}
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
                  <span>Par {item.course_par}</span>
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
              onChange={(eventItem) => setPlayerName(eventItem.target.value)}
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
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={playerLoading || !event}
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
                <span className="text-slate-500">
                  Handicap {player.handicap} • Start {player.starting_score}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {leaderboardLink && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Share Links</h2>
          <p className="mt-2 text-sm text-slate-600">
            Copy the leaderboard and score entry links for each round.
          </p>
          <div className="mt-4 grid gap-3">
            {leaderboardLink.map((round) => (
              <div
                key={round.id}
                className="rounded-2xl border border-slate-100 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{round.label}</p>
                <div className="mt-2 grid gap-2 text-xs text-slate-500">
                  <span>Leaderboard: {round.leaderboard}</span>
                  <span>Entry: {round.entry}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    className="rounded-2xl border border-pine-200 px-3 py-2 text-xs font-semibold text-pine-700"
                    href={round.leaderboard}
                  >
                    Open Leaderboard
                  </Link>
                  <Link
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                    href={round.entry}
                  >
                    Open Entry
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Admin Access</h2>
        <p className="mt-2 text-sm text-slate-600">
          Invite additional admins (magic link via email).
        </p>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Admin Email
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={inviteEmail}
              onChange={(eventItem) => setInviteEmail(eventItem.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Role
            <select
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={inviteRole}
              onChange={(eventItem) => setInviteRole(eventItem.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={inviteLoading || !event}
            onClick={handleInviteAdmin}
            type="button"
          >
            {inviteLoading ? "Sending..." : "Invite Admin"}
          </button>
        </div>

        {admins.length > 0 && (
          <div className="mt-4 grid gap-2">
            {admins.map((admin) => (
              <div
                key={admin.user_id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm"
              >
                <span className="font-semibold text-slate-900">
                  {admin.user_id}
                </span>
                <span className="text-slate-500">{admin.role}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
