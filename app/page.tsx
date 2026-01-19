"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  buildTripStandings,
  rankTripStandings,
  type EventRound,
  type PlayerRow,
  type ScoreRow,
  type RankedTripStandingRow
} from "@/lib/leaderboard";

const EVENT_NAME = "Myrtle Beach Classic 2026";

type EventRow = {
  id: string;
  name: string;
  year: number | null;
};

type RoundRow = EventRound & {
  name: string | null;
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
      .select("id,name,year")
      .eq("name", EVENT_NAME)
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
          "id,event_id,round_number,name,course,date,course_par,handicap_enabled"
        )
        .eq("event_id", eventData.id)
        .order("round_number", { ascending: true }),
      supabase
        .from("players")
        .select("id,name,handicap,starting_score")
        .eq("event_id", eventData.id)
        .order("name", { ascending: true }),
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10">
      <header className="rounded-3xl bg-white/80 p-6 shadow-lg shadow-pine-100/70">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine-600">
          {eventLabel}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Trip Standings &amp; Live Leaderboards
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Overall standings update instantly as scores are entered for each
          round.
        </p>
      </header>

      {!event && (
        <section className="rounded-3xl border border-dashed border-pine-200 bg-white/80 p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Event not set up yet.</p>
          <p className="mt-2">
            Head to the admin dashboard to create the Myrtle Beach Classic 2026
            event and rounds.
          </p>
          <Link
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-pine-600 px-4 py-2 text-sm font-semibold text-white"
            href="/admin"
          >
            Go to Admin
          </Link>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Trip Standings
          </h2>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Overall
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
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
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    Loading standings...
                  </td>
                </tr>
              )}
              {!loading && standings.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="py-6 text-center text-sm text-slate-500"
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
                      ? "bg-slate-50/60"
                      : "bg-white"
                  }
                >
                  <td className="py-3 pr-3 font-semibold text-slate-700">
                    {row.position}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-3 pr-3 text-right text-slate-500">
                    {formatDelta(row.startingScore)}
                  </td>
                  {Array.from({ length: 5 }, (_, roundIndex) => (
                    row.roundResults[roundIndex] ?? null
                  )).map((result, roundIndex) => (
                    <td
                      key={`${row.playerId}-round-${roundIndex}`}
                      className="py-3 pr-3 text-right font-semibold text-slate-700"
                    >
                      {result === null ? "-" : formatDelta(result)}
                    </td>
                  ))}
                  <td className="py-3 pr-3 text-right text-slate-600">
                    {row.grossTotal ?? "-"}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-900">
                    {formatDelta(row.netTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trip Rounds
          </h2>
          <Link
            className="text-sm font-semibold text-pine-700"
            href="/admin"
          >
            Admin
          </Link>
        </div>
        {rounds.length === 0 && (
          <div className="rounded-2xl border border-dashed border-pine-200 bg-white/70 px-5 py-4 text-sm text-slate-600">
            No rounds yet. Create Round 1-5 in the admin panel.
          </div>
        )}
        {rounds.map((round) => (
          <Link
            key={round.id}
            className="flex flex-col gap-1 rounded-2xl border border-pine-100 bg-white px-5 py-4 text-sm shadow-sm transition hover:border-pine-200"
            href={`/r/${round.id}`}
          >
            <span className="text-base font-semibold text-slate-900">
              Round {round.round_number}
            </span>
            <span className="text-xs text-slate-500">
              {round.name ?? EVENT_NAME}
            </span>
            {(round.course || round.date) && (
              <span className="text-xs text-slate-500">
                {[round.course, round.date].filter(Boolean).join(" • ")}
              </span>
            )}
          </Link>
        ))}
      </section>
    </main>
  );
}
