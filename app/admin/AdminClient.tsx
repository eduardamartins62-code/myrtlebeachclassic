"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/app/components/AdminShell";
import AdminLogoutButton from "@/app/components/AdminLogoutButton";
import { EVENT_NAME } from "@/lib/event";
import { supabase } from "@/lib/supabaseClient";

const emptyPlayerForm = {
  name: "",
  handicap: 0,
  starting_score: 0
};

const emptyEventForm = {
  name: "",
  slug: ""
};

type EventRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
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

type AdminClientProps = {
  event: EventRow | null;
  initialEvents: EventRow[];
  initialPlayers: PlayerRow[];
  initialRounds: RoundRow[];
};

const sortPlayers = (items: PlayerRow[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

const sortRounds = (items: RoundRow[]) =>
  [...items].sort((a, b) => a.round_number - b.round_number);

const formatDate = (value: string | null) => {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString();
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function AdminClient({
  event,
  initialEvents,
  initialPlayers,
  initialRounds
}: AdminClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [activeEvent, setActiveEvent] = useState<EventRow | null>(event);
  const [players, setPlayers] = useState<PlayerRow[]>(
    sortPlayers(initialPlayers)
  );
  const [rounds, setRounds] = useState<RoundRow[]>(sortRounds(initialRounds));
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [playerForm, setPlayerForm] = useState(emptyPlayerForm);
  const [eventLoading, setEventLoading] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [roundsLoading, setRoundsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const playerCount = players.length;
  const roundCount = rounds.length;
  const eventLocation = "Myrtle Beach, SC";

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleCreateEvent = async () => {
    const name = eventForm.name.trim();
    const slug = eventForm.slug.trim();

    if (!name) {
      showToast("Enter an event name.");
      return;
    }

    if (!slug) {
      showToast("Enter an event slug.");
      return;
    }

    setEventLoading(true);
    const response = await fetch("/api/events/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug })
    });

    const payload = (await response.json()) as {
      event?: EventRow;
      error?: string;
    };

    if (!response.ok || !payload.event) {
      showToast(payload.error ?? "Unable to create event.");
      setEventLoading(false);
      return;
    }

    const createdEvent = payload.event;
    setEvents((prev) => {
      const next = prev.filter((item) => item.id !== createdEvent.id);
      return [createdEvent, ...next];
    });
    setActiveEvent(createdEvent);
    setPlayers([]);
    setRounds([]);
    setEventForm(emptyEventForm);
    showToast("Event created.");
    router.push(`/admin?eventId=${createdEvent.id}`);
    setEventLoading(false);
  };

  const handleAddPlayer = async () => {
    if (!activeEvent) {
      showToast("Event not found.");
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
        event_id: activeEvent.id,
        name: playerForm.name.trim(),
        handicap: playerForm.handicap,
        starting_score: playerForm.starting_score
      })
      .select("id,name,handicap,starting_score")
      .single();

    if (error || !data) {
      showToast("Failed to add player.");
      setPlayerLoading(false);
      return;
    }

    setPlayers((prev) => sortPlayers([...prev, data]));
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

  const handleCreateDefaultRounds = async () => {
    if (!activeEvent) {
      showToast("Event not found.");
      return;
    }

    setRoundsLoading(true);
    const defaultRounds = Array.from({ length: 5 }, (_, index) => ({
      event_id: activeEvent.id,
      round_number: index + 1,
      course: `Course ${index + 1}`,
      date: null,
      par: 72
    }));

    const { data, error } = await supabase
      .from("rounds")
      .insert(defaultRounds)
      .select("id,round_number,course,date,par");

    if (error || !data) {
      showToast("Failed to create rounds.");
      setRoundsLoading(false);
      return;
    }

    setRounds(sortRounds(data as RoundRow[]));
    showToast("Default rounds created.");
    setRoundsLoading(false);
  };

  return (
    <AdminShell
      title="Myrtle Beach Classic 2026 – Admin"
      subtitle="Admin Portal"
      description="Manage events, rounds, roster, and trip content."
      actions={<AdminLogoutButton />}
    >
      {toast && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {toast}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Events & Rounds",
            description: "Create events, rounds, and manage the roster.",
            href: "#events"
          },
          {
            title: "Itinerary Management",
            description: "Edit trip details, restaurants, and activities.",
            href: "/admin/itinerary"
          },
          {
            title: "History / Past Events",
            description: "Publish highlights from previous years.",
            href: "/admin/history"
          },
          {
            title: "User Roles",
            description: "Assign SUPER_ADMIN and SCORE_KEEPER access.",
            href: "/admin/roles"
          }
        ].map((card) => (
          <Link
            key={card.title}
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            href={card.href}
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>

      <section
        id="events"
        className="rounded-3xl bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Events</h2>
            <p className="mt-1 text-sm text-slate-600">
              Create new events or select one to manage.
            </p>
          </div>
          <button
            className="h-9 rounded-2xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
            onClick={() =>
              setEventForm((prev) => ({
                ...prev,
                name: "",
                slug: ""
              }))
            }
            type="button"
          >
            Reset form
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Event name
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={eventForm.name}
              onChange={(eventItem) =>
                setEventForm((prev) => {
                  const name = eventItem.target.value;
                  return {
                    ...prev,
                    name,
                    slug: prev.slug ? prev.slug : toSlug(name)
                  };
                })
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Event slug
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              value={eventForm.slug}
              onChange={(eventItem) =>
                setEventForm((prev) => ({
                  ...prev,
                  slug: eventItem.target.value
                }))
              }
            />
          </label>
        </div>
        <button
          className="mt-4 h-12 w-full rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60 sm:w-auto sm:px-6"
          disabled={eventLoading}
          onClick={handleCreateEvent}
          type="button"
        >
          {eventLoading ? "Creating..." : "Create event"}
        </button>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.map((item) => {
            const isActive = activeEvent?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveEvent(item);
                  router.push(`/admin?eventId=${item.id}`);
                }}
                className={`flex flex-col rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  isActive
                    ? "border-pine-500 bg-pine-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.slug}
                </span>
                <span className="mt-1 text-base font-semibold text-slate-900">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeEvent && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Event snapshot
            </h2>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Event
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {activeEvent.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Location
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {eventLocation}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Players
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {playerCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Rounds
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {roundCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Rounds</h2>
            <p className="mt-1 text-sm text-slate-600">
              Create the 5 default rounds or manage existing rounds.
            </p>
            <button
              className="mt-4 h-10 rounded-2xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 disabled:opacity-60"
              disabled={roundsLoading}
              onClick={handleCreateDefaultRounds}
              type="button"
            >
              {roundsLoading ? "Creating..." : "Create default rounds"}
            </button>
            <div className="mt-4 grid gap-3">
              {rounds.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                  No rounds created yet.
                </p>
              )}
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      Round {round.round_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {round.course ?? "Course TBD"} • {formatDate(round.date)}
                    </p>
                  </div>
                  <Link
                    className="text-xs font-semibold text-pine-600"
                    href={`/r/${round.id}/enter`}
                  >
                    Enter scores
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeEvent && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Players</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add players for {activeEvent.name}.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Player name
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
                type="number"
                value={playerForm.handicap}
                onChange={(eventItem) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    handicap: Number(eventItem.target.value)
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Starting score
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
          </div>
          <button
            className="mt-4 h-12 rounded-2xl bg-pine-600 px-6 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={playerLoading}
            onClick={handleAddPlayer}
            type="button"
          >
            {playerLoading ? "Adding..." : "Add player"}
          </button>

          <div className="mt-6 grid gap-3">
            {players.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                No players added yet.
              </p>
            )}
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {player.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Handicap {player.handicap} • Starting {player.starting_score}
                  </p>
                </div>
                <button
                  className="text-xs font-semibold text-red-500"
                  onClick={() => handleDeletePlayer(player.id, player.name)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!activeEvent && (
        <section className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">No event selected.</p>
          <p className="mt-2">
            Create a new event above to manage rounds, players, and scoring.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-pine-50 p-6 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Current event highlight</p>
        <p className="mt-2">
          {activeEvent?.name ?? EVENT_NAME} • {eventLocation}
        </p>
      </section>
    </AdminShell>
  );
}
