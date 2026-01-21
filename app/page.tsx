"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EVENT_NAME, EVENT_SLUG } from "@/lib/event";
import { supabase } from "@/lib/supabaseClient";
import {
  buildTripStandings,
  rankTripStandings,
  type EventRound,
  type PlayerRow,
  type ScoreRow,
  type RankedTripStandingRow
} from "@/lib/leaderboard";

type EventRow = {
  id: string;
  name: string;
  slug: string;
};

type RoundRow = EventRound & {
  course: string | null;
  date: string | null;
};

const formatDelta = (value: number) => {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
};

export default function HomePage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTripData = useCallback(async () => {
    setLoading(true);
    const { data: eventData } = await supabase
      .from("events")
      .select("id,name,slug")
      .eq("slug", EVENT_SLUG)
      .maybeSingle();

    if (!eventData) {
      setEvent(null);
      setRounds([]);
      setPlayers([]);
      setScores([]);
      setLoading(false);
      return;
    }

    const [roundsRes, playersRes] = await Promise.all([
      supabase
        .from("rounds")
        .select(
          "id,event_id,round_number,course,date,par"
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
    const playerRows = (playersRes.data ?? []) as Array<{
      id: string;
      name: string;
      handicap: number | null;
      starting_score: number | null;
    }>;
    const roundIds = roundRows.map((round) => round.id);
    const scoresRes =
      roundIds.length > 0
        ? await supabase
            .from("scores")
            .select("round_id,player_id,hole_number,strokes")
            .in("round_id", roundIds)
        : { data: [] };

    setEvent(eventData);
    setRounds(roundRows);
    setPlayers(
      playerRows.map((player) => ({
        id: player.id,
        name: player.name,
        handicap: player.handicap ?? 0,
        starting_score: player.starting_score ?? 0
      }))
    );
    setScores((scoresRes.data ?? []) as ScoreRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTripData();
  }, [loadTripData]);

  const roundIds = useMemo(() => rounds.map((round) => round.id), [rounds]);

  useEffect(() => {
    if (!event) return;
    const channel = supabase.channel(`event-${event.id}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `event_id=eq.${event.id}`
        },
        () => void loadTripData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `event_id=eq.${event.id}`
        },
        () => void loadTripData()
      );

    if (roundIds.length > 0) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scores",
          filter: `round_id=in.(${roundIds.join(",")})`
        },
        () => void loadTripData()
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [event, roundIds, loadTripData]);

  const standings = useMemo<RankedTripStandingRow[]>(() => {
    if (!event) return [];
    const rows = buildTripStandings(players, rounds, scores);
    return rankTripStandings(rows);
  }, [event, players, rounds, scores]);

  const eventLabel = event?.name ?? EVENT_NAME;
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_50%),radial-gradient(circle_at_30%_60%,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10">
          <header className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                  <Image
                    src="/myrtle-beach-classic-logo.png"
                    alt="Myrtle Beach Classic logo"
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                    Official Event Hub
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">
                    {eventLabel}
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-emerald-300 hover:text-white"
                  href="/admin"
                >
                  Admin Portal
                </Link>
                <Link
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-300"
                  href="/admin"
                >
                  Manage Roster
                </Link>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  Championship Week
                </p>
                <h2 className="text-4xl font-semibold leading-tight">
                  Live leaderboards, round-by-round scoring, and trip
                  bragging rights in one place.
                </h2>
                <p className="text-sm text-white/70">
                  Track the Myrtle Beach Classic action in real time, see where
                  the trip stands, and follow every round as it unfolds on the
                  coast.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Dates
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      May 6-10, 2026
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Myrtle Beach, SC
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Format
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      5 Rounds • Net Scoring
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    title: "Daily Pairings",
                    detail: "Live updates from sunrise tee times to sunset drama."
                  },
                  {
                    title: "On-Course Intelligence",
                    detail: "Courses, pars, and handicaps synced to scoring."
                  },
                  {
                    title: "Fan Experience",
                    detail: "Share highlights, track standings, and plan meetups."
                  }
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm"
                  >
                    <p className="text-base font-semibold text-white">
                      {card.title}
                    </p>
                    <p className="mt-1 text-white/70">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {!event && (
            <section className="rounded-3xl border border-dashed border-emerald-200/40 bg-white/5 p-6 text-sm text-white/70">
              <p className="font-semibold text-white">Event not set up yet.</p>
              <p className="mt-2">
                Head to the admin dashboard to create the Myrtle Beach Classic
                2026 event and rounds.
              </p>
              <Link
                className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950"
                href="/admin"
              >
                Go to Admin
              </Link>
            </section>
          )}

          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-lg shadow-emerald-500/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  Live Trip Standings
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Leaderboard
                </h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                Overall
              </span>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm text-white">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    <th className="py-3 pr-3">Pos</th>
                    <th className="py-3 pr-3">Player</th>
                    <th className="py-3 pr-3 text-right">Starting</th>
                    {[1, 2, 3, 4, 5].map((round) => (
                      <th key={round} className="py-3 pr-3 text-right">
                        R{round}
                      </th>
                    ))}
                    <th className="py-3 pr-3 text-right">Gross</th>
                    <th className="py-3 text-right">Net Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-6 text-center text-sm text-white/70"
                      >
                        Loading standings...
                      </td>
                    </tr>
                  )}
                  {!loading && standings.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-6 text-center text-sm text-white/70"
                      >
                        No players yet. Add players in the admin dashboard.
                      </td>
                    </tr>
                  )}
                  {standings.map((row, index) => (
                    <tr
                      key={row.playerId}
                      className={
                        index % 2 === 0
                          ? "bg-white/5"
                          : "bg-transparent"
                      }
                    >
                      <td className="py-3 pr-3 font-semibold text-white">
                        {row.position}
                      </td>
                      <td className="py-3 pr-3 font-semibold text-white">
                        {row.name}
                      </td>
                      <td className="py-3 pr-3 text-right text-white/60">
                        {formatDelta(row.startingScore)}
                      </td>
                      {Array.from({ length: 5 }, (_, roundIndex) => (
                        row.roundResults[roundIndex] ?? null
                      )).map((result, roundIndex) => (
                        <td
                          key={`${row.playerId}-round-${roundIndex}`}
                          className="py-3 pr-3 text-right font-semibold text-white/80"
                        >
                          {result === null ? "-" : formatDelta(result)}
                        </td>
                      ))}
                      <td className="py-3 pr-3 text-right text-white/70">
                        {row.grossTotal ?? "-"}
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-200">
                        {formatDelta(row.netTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  The Rounds
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Schedule &amp; Course Notes
                </h2>
              </div>
            </div>
            {rounds.length === 0 && (
              <div className="rounded-2xl border border-dashed border-emerald-200/40 bg-white/5 px-5 py-4 text-sm text-white/70">
                No rounds yet. Create Round 1-5 in the admin panel.
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {rounds.map((round) => (
                <Link
                  key={round.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm transition hover:border-emerald-300"
                  href={`/r/${round.id}`}
                >
                  <span className="text-base font-semibold text-white">
                    Round {round.round_number}
                  </span>
                  <span className="text-xs text-white/60">
                    {event?.name ?? EVENT_NAME}
                  </span>
                  {(round.course || round.date) && (
                    <span className="text-xs text-white/60">
                      {[round.course, round.date].filter(Boolean).join(" • ")}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
