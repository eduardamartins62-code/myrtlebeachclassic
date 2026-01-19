"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  buildRoundLeaderboard,
  rankRoundLeaderboard,
  type EventRound,
  type PlayerRow,
  type ScoreRow,
  type RankedRoundRow
} from "@/lib/leaderboard";

const formatDelta = (value: number) => {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
};

type RoundMeta = EventRound & {
  name: string | null;
  course: string | null;
  date: string | null;
  event_id: string;
};

type EventRow = {
  id: string;
  name: string;
};

type ScoreWithUpdated = ScoreRow & { updated_at: string };

type LeaderboardClientProps = {
  roundId: string;
};

export default function LeaderboardClient({ roundId }: LeaderboardClientProps) {
  const [round, setRound] = useState<RoundMeta | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const roundRes = await supabase
      .from("rounds")
      .select(
        "id,name,round_number,course,date,handicap_enabled,course_par,event_id"
      )
      .eq("id", roundId)
      .maybeSingle();

    if (roundRes.error || !roundRes.data) {
      setError("Unable to load leaderboard right now.");
      setLoading(false);
      return;
    }

    const [eventRes, playersRes, scoresRes] = await Promise.all([
      supabase
        .from("events")
        .select("id,name")
        .eq("id", roundRes.data.event_id)
        .maybeSingle(),
      supabase
        .from("players")
        .select("id,name,handicap,starting_score")
        .eq("event_id", roundRes.data.event_id),
      supabase
        .from("scores")
        .select("round_id,player_id,hole_number,strokes,updated_at")
        .eq("round_id", roundId)
    ]);

    if (playersRes.error || scoresRes.error) {
      setError("Unable to load leaderboard right now.");
      setLoading(false);
      return;
    }

    setRound(roundRes.data as RoundMeta);
    setEvent(eventRes.data ?? null);
    setPlayers(
      (playersRes.data ?? []).map((player) => ({
        id: player.id,
        name: player.name,
        handicap: player.handicap ?? 0,
        starting_score: player.starting_score ?? 0
      }))
    );
    const scoreData = (scoresRes.data ?? []) as ScoreWithUpdated[];
    setScores(
      scoreData.map((score) => ({
        round_id: score.round_id,
        player_id: score.player_id,
        hole_number: score.hole_number,
        strokes: score.strokes
      }))
    );
    const latestUpdate = scoreData.reduce<Date | null>((latest, score) => {
      if (!score.updated_at) return latest;
      const updatedAt = new Date(score.updated_at);
      if (!latest || updatedAt > latest) {
        return updatedAt;
      }
      return latest;
    }, null);
    setLastUpdated(latestUpdate);
    setLoading(false);
  }, [roundId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!round) return;
    const channel = supabase
      .channel(`round-${roundId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scores",
          filter: `round_id=eq.${roundId}`
        },
        () => {
          void loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `event_id=eq.${round.event_id}`
        },
        () => {
          void loadData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roundId, round, loadData]);

  const ranked = useMemo<RankedRoundRow[]>(() => {
    if (!round) return [];
    const rows = buildRoundLeaderboard(players, scores, round);
    return rankRoundLeaderboard(rows);
  }, [players, scores, round]);

  const eventName = event?.name ?? "Myrtle Beach Classic 2026";
  const roundLabel = round?.round_number
    ? `Round ${round.round_number}`
    : "Round";
  const roundDetail = `${eventName} – ${roundLabel}`;
  const courseDetail = round?.course ?? null;
  const dateDetail = round?.date
    ? new Date(round.date).toLocaleDateString()
    : null;
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString()
    : "Awaiting updates";

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-slate-950 px-4 py-8 text-white">
      <div className="w-full max-w-5xl">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="w-full rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4 shadow-[0_20px_60px_rgba(15,23,42,0.6)] sm:p-6">
          <header className="flex flex-col gap-2 border-b border-slate-700/70 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {eventName}
            </p>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {roundDetail}
            </h1>
            {(courseDetail || dateDetail) && (
              <p className="text-sm text-slate-300">
                {[courseDetail, dateDetail].filter(Boolean).join(" • ")}
              </p>
            )}
          </header>

          <div className="mt-4 grid grid-cols-[50px_1fr_80px_80px_60px_80px_80px] gap-2 border-b border-slate-700/70 px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:grid-cols-[60px_1fr_90px_90px_70px_90px_90px]">
            <span>Pos</span>
            <span>Player</span>
            <span className="text-right">Total</span>
            <span className="text-right">Today</span>
            <span className="text-right">Thru</span>
            <span className="text-right">Gross</span>
            <span className="text-right">Net</span>
          </div>

          <div className="flex flex-col">
            {loading && (
              <div className="py-6 text-center text-sm text-slate-400">
                Loading leaderboard...
              </div>
            )}

            {!loading && ranked.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400">
                No players yet. Add players in the admin panel.
              </div>
            )}

            {ranked.map((row) => {
              const totalToPar = row.netToPar;
              const todayToPar = row.netToPar;
              const isLeader =
                totalToPar !== null &&
                ranked[0]?.netToPar !== null &&
                totalToPar === ranked[0]?.netToPar;
              const thruLabel =
                row.holesEntered >= 18
                  ? "F"
                  : row.holesEntered
                    ? row.holesEntered
                    : "-";

              return (
                <div
                  key={row.playerId}
                  className={`grid grid-cols-[50px_1fr_80px_80px_60px_80px_80px] items-center gap-2 border-b border-slate-800/70 px-2 py-2 text-sm sm:grid-cols-[60px_1fr_90px_90px_70px_90px_90px] sm:text-base ${
                    isLeader ? "bg-slate-800/80" : "bg-slate-900/80"
                  }`}
                >
                  <span className="text-base font-semibold text-white">
                    {row.position}
                  </span>
                  <span className="font-semibold text-white">{row.name}</span>
                  <span className="text-right font-semibold text-white">
                    {totalToPar === null ? "-" : formatDelta(totalToPar)}
                  </span>
                  <span className="text-right font-semibold text-slate-100">
                    {todayToPar === null ? "-" : formatDelta(todayToPar)}
                  </span>
                  <span className="text-right text-slate-200">
                    {thruLabel}
                  </span>
                  <span className="text-right font-semibold text-slate-200">
                    {row.grossTotal || row.holesEntered > 0
                      ? row.grossTotal
                      : "-"}
                  </span>
                  <span className="text-right font-semibold text-white">
                    {row.holesEntered > 0 ? row.netTotal : "-"}
                  </span>
                </div>
              );
            })}
          </div>

          <footer className="mt-3 flex flex-col justify-between gap-2 px-2 text-xs text-slate-400 sm:flex-row">
            <span>Handicap adjusted • Par assumed evenly across holes</span>
            <span>Last updated: {lastUpdatedLabel}</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
