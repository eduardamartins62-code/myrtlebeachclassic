"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/app/components/AdminShell";
import { EVENT_NAME } from "@/lib/event";
import { supabase } from "@/lib/supabaseClient";

const emptyPlayerForm = {
  name: "",
  handicap: 0,
  starting_score: 0
};

const emptyItineraryForm = {
  category: "golf",
  day: "",
  name: "",
  description: "",
  address: "",
  url: ""
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

type ItineraryItemRow = {
  id: string;
  category: string;
  day: string | null;
  name: string;
  description: string | null;
  address: string | null;
  url: string | null;
  sort_order: number | null;
};

type AdminClientProps = {
  event: EventRow | null;
  initialEvents: EventRow[];
  initialPlayers: PlayerRow[];
  initialRounds: RoundRow[];
  initialItineraryItems: ItineraryItemRow[];
  showItinerary: boolean;
};

const sortPlayers = (items: PlayerRow[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

const sortRounds = (items: RoundRow[]) =>
  [...items].sort((a, b) => a.round_number - b.round_number);

const formatDate = (value: string | null) => {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString();
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleDateString();

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
  initialRounds,
  initialItineraryItems,
  showItinerary
}: AdminClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [activeEvent, setActiveEvent] = useState<EventRow | null>(event);
  const [players, setPlayers] = useState<PlayerRow[]>(
    sortPlayers(initialPlayers)
  );
  const [rounds, setRounds] = useState<RoundRow[]>(sortRounds(initialRounds));
  const [itineraryItems, setItineraryItems] = useState<ItineraryItemRow[]>(
    initialItineraryItems
  );
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [playerForm, setPlayerForm] = useState(emptyPlayerForm);
  const [itineraryForm, setItineraryForm] = useState(emptyItineraryForm);
  const [eventLoading, setEventLoading] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [roundsLoading, setRoundsLoading] = useState(false);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const playerCount = players.length;
  const roundCount = rounds.length;
  const eventLocation = "Myrtle Beach, SC";

  const groupedItinerary = useMemo(() => {
    if (!showItinerary) return [];
    const categories = ["golf", "restaurant", "nightlife", "other"];
    const grouped = new Map<string, ItineraryItemRow[]>();
    categories.forEach((category) => grouped.set(category, []));
    itineraryItems.forEach((item) => {
      const key = grouped.has(item.category) ? item.category : "other";
      grouped.get(key)?.push(item);
    });
    return categories.map((category) => ({
      category,
      items: grouped.get(category) ?? []
    }));
  }, [itineraryItems, showItinerary]);

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
    setItineraryItems([]);
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

  const handleAddItineraryItem = async () => {
    if (!activeEvent) {
      showToast("Event not found.");
      return;
    }
    if (!itineraryForm.name.trim()) {
      showToast("Enter an itinerary name.");
      return;
    }

    setItineraryLoading(true);
    const { data, error } = await supabase
      .from("itinerary_items")
      .insert({
        event_id: activeEvent.id,
        category: itineraryForm.category,
        day: itineraryForm.day.trim() || null,
        name: itineraryForm.name.trim(),
        description: itineraryForm.description.trim() || null,
        address: itineraryForm.address.trim() || null,
        url: itineraryForm.url.trim() || null,
        sort_order: itineraryItems.length + 1
      })
      .select(
        "id,category,day,name,description,address,url,sort_order"
      )
      .single();

    if (error || !data) {
      showToast("Failed to add itinerary item.");
      setItineraryLoading(false);
      return;
    }

    setItineraryItems((prev) => [...prev, data]);
    setItineraryForm(emptyItineraryForm);
    showToast("Itinerary item added.");
    setItineraryLoading(false);
  };

  const handleDeleteItineraryItem = async (
    itemId: string,
    itemName: string
  ) => {
    const confirmed = window.confirm(`Delete itinerary item ${itemName}?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("itinerary_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      showToast("Failed to delete itinerary item.");
      return;
    }

    setItineraryItems((prev) => prev.filter((item) => item.id !== itemId));
    showToast("Itinerary item deleted.");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  };

  return (
    <AdminShell
      title="Myrtle Beach Classic 2026 – Admin"
      subtitle="Admin Portal"
      description="Manage the Myrtle Beach Classic 2026 trip details."
      actions={
        <button
          className="h-9 rounded-2xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
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

      <section className="rounded-3xl bg-white p-6 shadow-sm">
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

        {events.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">Slug</th>
                  <th className="py-3 pr-3">Created</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 pr-3">{item.slug}</td>
                    <td className="py-3 pr-3">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold ${
                          activeEvent?.id === item.id
                            ? "border-pine-300 bg-pine-50 text-pine-700"
                            : "border-slate-200 text-slate-700"
                        }`}
                        href={`/admin?eventId=${item.id}`}
                      >
                        {activeEvent?.id === item.id ? "Managing" : "Manage"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No events yet. Create your first event above.
          </p>
        )}
      </section>

      {!activeEvent && (
        <section className="rounded-3xl bg-white p-6 text-sm text-slate-600 shadow-sm">
          Select an event to manage or create a new event to get started.
        </section>
      )}

      {activeEvent && (
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Event Snapshot
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Quick read-only details for the active event.
        </p>
        <div className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Name
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {activeEvent.name ?? EVENT_NAME}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Location
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {eventLocation}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Players
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {playerCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Rounds
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {roundCount}
            </p>
          </div>
        </div>
      </section>
      )}

      {activeEvent && (
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Players Management
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Add or remove players for the event.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
        </div>
        <button
          className="mt-4 h-12 w-full rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60 sm:w-auto sm:px-6"
          disabled={playerLoading}
          onClick={handleAddPlayer}
          type="button"
        >
          {playerLoading ? "Adding..." : "Add player"}
        </button>

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

      {activeEvent && (
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Rounds Overview</h2>
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
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>No rounds yet. Create default rounds to activate leaderboards.</p>
            <button
              className="h-10 rounded-2xl border border-pine-200 px-4 text-xs font-semibold text-pine-700 disabled:opacity-60"
              disabled={roundsLoading}
              onClick={handleCreateDefaultRounds}
              type="button"
            >
              {roundsLoading ? "Creating..." : "Create default rounds"}
            </button>
          </div>
        )}
      </section>
      )}

      {activeEvent && showItinerary && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Itinerary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track golf, restaurants, and nightlife for the trip.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Category
              <select
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                value={itineraryForm.category}
                onChange={(eventItem) =>
                  setItineraryForm((prev) => ({
                    ...prev,
                    category: eventItem.target.value
                  }))
                }
              >
                <option value="golf">Golf</option>
                <option value="restaurant">Restaurant</option>
                <option value="nightlife">Nightlife</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Day
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                placeholder="Day 1"
                value={itineraryForm.day}
                onChange={(eventItem) =>
                  setItineraryForm((prev) => ({
                    ...prev,
                    day: eventItem.target.value
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Name
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                value={itineraryForm.name}
                onChange={(eventItem) =>
                  setItineraryForm((prev) => ({
                    ...prev,
                    name: eventItem.target.value
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Description
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                value={itineraryForm.description}
                onChange={(eventItem) =>
                  setItineraryForm((prev) => ({
                    ...prev,
                    description: eventItem.target.value
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Address
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                value={itineraryForm.address}
                onChange={(eventItem) =>
                  setItineraryForm((prev) => ({
                    ...prev,
                    address: eventItem.target.value
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              URL
              <input
                className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
                value={itineraryForm.url}
                onChange={(eventItem) =>
                  setItineraryForm((prev) => ({
                    ...prev,
                    url: eventItem.target.value
                  }))
                }
              />
            </label>
          </div>
          <button
            className="mt-4 h-12 w-full rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60 sm:w-auto sm:px-6"
            disabled={itineraryLoading}
            onClick={handleAddItineraryItem}
            type="button"
          >
            {itineraryLoading ? "Saving..." : "Add itinerary item"}
          </button>

          {groupedItinerary.length > 0 && itineraryItems.length > 0 ? (
            <div className="mt-6 space-y-6">
              {groupedItinerary.map((group) => (
                <div key={group.category}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {group.category}
                  </h3>
                  {group.items.length > 0 ? (
                    <div className="mt-3 grid gap-3">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                        >
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.day ?? "No day set"}
                              </p>
                            </div>
                            <button
                              className="h-8 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600"
                              onClick={() =>
                                handleDeleteItineraryItem(item.id, item.name)
                              }
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            {item.description && <p>{item.description}</p>}
                            {item.address && <p>{item.address}</p>}
                            {item.url && (
                              <a
                                className="text-pine-600 underline"
                                href={item.url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {item.url}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No items yet for this category.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No itinerary items yet.
            </p>
          )}
        </section>
      )}
    </AdminShell>
  );
}
