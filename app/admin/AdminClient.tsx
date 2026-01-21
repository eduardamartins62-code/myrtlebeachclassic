"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/app/components/AdminShell";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import { supabase } from "@/lib/supabaseClient";
import { useAdminStatus } from "@/lib/useAdminStatus";

const emptyRound = {
  round_number: 1,
  course: "",
  date: "",
  par: 72,
  entry_pin: ""
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
  email: string;
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
  const [loading, setLoading] = useState(true);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editPlayerHandicap, setEditPlayerHandicap] = useState(0);
  const [editPlayerStartingScore, setEditPlayerStartingScore] = useState(0);

  const { isAdmin, isAuthenticated, loading: authLoading } = useAdminStatus(
    event?.id
  );

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
      setAdmins([]);
      setLoading(false);
      return;
    }

    const [roundsRes, playersRes] = await Promise.all([
      supabase
        .from("rounds")
        .select(
          "id,round_number,course,date,par,entry_pin"
        )
        .eq("event_id", eventData.id)
        .order("round_number", { ascending: true }),
      supabase
        .from("players")
        .select("id,name,handicap,starting_score")
        .eq("event_id", eventData.id)
        .order("name", { ascending: true })
    ]);

    const roundRows = (roundsRes.data ?? []) as RoundRow[];
    const playerRows = (playersRes.data ?? []) as PlayerRow[];

    setRounds(roundRows);
    setPlayers(playerRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadEventData();
  }, [loadEventData]);

  const loadAdmins = useCallback(async () => {
    if (!event) return;
    const response = await fetch(`/api/admins/list?eventId=${event.id}`);
    if (!response.ok) {
      showToast("Failed to load admin list.");
      return;
    }
    const data = (await response.json()) as { admins?: AdminRow[] };
    setAdmins(data.admins ?? []);
  }, [event]);

  useEffect(() => {
    if (event && isAdmin) {
      void loadAdmins();
    }
  }, [event, isAdmin, loadAdmins]);


  const handleCreateEvent = async () => {
    setEventLoading(true);
    const response = await fetch("/api/events/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: EVENT_NAME,
        slug: EVENT_SLUG
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
        round_number: roundForm.round_number,
        course: roundForm.course,
        date: roundForm.date || null,
        par: roundForm.par,
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

  const handleEditPlayer = (player: PlayerRow) => {
    setEditingPlayerId(player.id);
    setEditPlayerName(player.name);
    setEditPlayerHandicap(player.handicap);
    setEditPlayerStartingScore(player.starting_score);
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
  };

  const handleUpdatePlayer = async (playerId: string) => {
    if (!isAdmin) {
      showToast("Admin access required to edit players.");
      return;
    }
    if (!editPlayerName.trim()) {
      showToast("Enter a player name.");
      return;
    }

    const { data, error } = await supabase
      .from("players")
      .update({
        name: editPlayerName.trim(),
        handicap: editPlayerHandicap,
        starting_score: editPlayerStartingScore
      })
      .eq("id", playerId)
      .select()
      .single();

    if (error || !data) {
      showToast("Failed to update player.");
      return;
    }

    setPlayers((prev) =>
      prev.map((player) => (player.id === playerId ? data : player))
    );
    setEditingPlayerId(null);
    showToast("Player updated.");
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!isAdmin) {
      showToast("Admin access required to delete players.");
      return;
    }
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
    void loadAdmins();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading || authLoading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">Loading...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminShell
        title="Admin sign-in required"
        subtitle={EVENT_NAME}
        description="You must be logged in to access the admin dashboard."
      >
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-pine-600 px-4 text-sm font-semibold text-white"
            href="/login"
          >
            Go to Login
          </Link>
        </section>
      </AdminShell>
    );
  }

  if (event && !isAdmin) {
    return (
      <AdminShell
        title="You do not have admin access"
        subtitle={EVENT_NAME}
        description="You are logged in, but not listed as an admin for this event."
        actions={
          <button
            className="h-10 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
            onClick={handleSignOut}
            type="button"
          >
            Sign out
          </button>
        }
      >
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            Ask an existing admin to add you to the event admin list.
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle={EVENT_NAME}
      description="Manage rounds, players, and admin access."
      actions={
        <button
          className="h-10 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          onClick={handleSignOut}
          type="button"
        >
          Sign out
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Event Summary
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {event.name} • {event.slug}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{rounds.length}/5 rounds created</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {rounds.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                No rounds yet. Add rounds 1–5 below.
              </div>
            )}
            {rounds.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Round {item.round_number}
                    </p>
                    {(item.course || item.date) && (
                      <p className="text-xs text-slate-500">
                        {[item.course, item.date].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-pine-200 px-3 text-xs font-semibold text-pine-700"
                      href={`/r/${item.id}`}
                    >
                      Leaderboard
                    </Link>
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                      href={`/r/${item.id}/enter`}
                    >
                      Enter Scores
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>Par {item.par}</span>
                  <span>PIN {item.entry_pin ? "enabled" : "open"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Add a round
            </h3>
            <div className="grid gap-4">
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
                Par
                <input
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                  type="number"
                  min={60}
                  max={80}
                  value={roundForm.par}
                  onChange={(eventItem) =>
                    setRoundForm((prev) => ({
                      ...prev,
                      par: Number(eventItem.target.value)
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
              <button
                className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
                disabled={roundLoading || !event}
                onClick={handleCreateRound}
                type="button"
              >
                {roundLoading ? "Creating..." : "Create Round"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Players Management
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Add, edit, or remove players for the event.
        </p>
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
            {players.map((player) => {
              const isEditing = editingPlayerId === player.id;
              return (
                <div
                  key={player.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm"
                >
                  {isEditing ? (
                    <div className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                          Name
                          <input
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 focus:border-pine-500 focus:outline-none"
                            value={editPlayerName}
                            onChange={(eventItem) =>
                              setEditPlayerName(eventItem.target.value)
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                          Handicap
                          <input
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 focus:border-pine-500 focus:outline-none"
                            max={36}
                            min={0}
                            type="number"
                            value={editPlayerHandicap}
                            onChange={(eventItem) =>
                              setEditPlayerHandicap(
                                Math.max(
                                  0,
                                  Math.min(
                                    36,
                                    Number(eventItem.target.value)
                                  )
                                )
                              )
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                          Starting Score
                          <input
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 focus:border-pine-500 focus:outline-none"
                            type="number"
                            value={editPlayerStartingScore}
                            onChange={(eventItem) =>
                              setEditPlayerStartingScore(
                                Number(eventItem.target.value)
                              )
                            }
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-pine-600 px-3 text-xs font-semibold text-white"
                          onClick={() => handleUpdatePlayer(player.id)}
                          type="button"
                        >
                          Save
                        </button>
                        <button
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                          onClick={handleCancelEdit}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">
                          {player.name}
                        </span>
                        <p className="text-xs text-slate-500">
                          Handicap {player.handicap} • Start{" "}
                          {player.starting_score}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                          onClick={() => handleEditPlayer(player)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            handleDeletePlayer(player.id, player.name)
                          }
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Admins Overview
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Current admins for the event (email + role).
        </p>

        {admins.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {admins.map((admin) => (
              <div
                key={admin.user_id}
                className="flex flex-col gap-1 rounded-2xl border border-slate-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-semibold text-slate-900">
                  {admin.email || admin.user_id}
                </span>
                <span className="text-slate-500">{admin.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No admins found for this event yet.
          </p>
        )}

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6">
          <p className="text-sm font-semibold text-slate-900">
            Invite additional admins (optional)
          </p>
          <div className="grid gap-4">
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
        </div>
      </section>
    </AdminShell>
  );
}
