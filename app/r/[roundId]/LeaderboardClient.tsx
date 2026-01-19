"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  buildLeaderboard,
  rankLeaderboard,
  type PlayerRow,
  type ScoreRow,
  type RankedLeaderboardRow
} from "@/lib/leaderboard";

const formatDelta = (value: number) => {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
};

type RoundRow = {
  id: string;
  name: string | null;
  round_number: number | null;
  course: string | null;
  date: string | null;
  handicap_enabled: boolean;
};

type ScoreWithUpdated = ScoreRow & { updated_at: string };

type LeaderboardClientProps = {
  roundId: string;
};

const coursePar = 72;
const parPerHole = coursePar / 18;

export default function LeaderboardClient({ roundId }: LeaderboardClientProps) {
  const [round, setRound] = useState<RoundRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [roundRes, playersRes, scoresRes] = await Promise.all([
      supabase
        .from("rounds")
        .select("id,name,round_number,course,date,handicap_enabled")
        .eq("id", roundId)
        .maybeSingle(),
      supabase.from("players").select("id,name,handicap").eq("round_id", roundId),
      supabase
        .from("scores")
        .select("player_id,hole_number,strokes,updated_at")
        .eq("round_id", roundId)
    ]);

    if (roundRes.error || playersRes.error || scoresRes.error) {
      setError("Unable to load leaderboard right now.");
      setLoading(false);
      return;
    }

    setRound(roundRes.data ?? null);
    setPlayers((playersRes.data ?? []).map((player) => ({
      id: player.id,
      name: player.name,
      handicap: player.handicap ?? 0
    })));
    const scoreData = (scoresRes.data ?? []) as ScoreWithUpdated[];
    setScores(
      scoreData.map((score) => ({
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
          filter: `round_id=eq.${roundId}`
        },
        () => {
          void loadData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roundId, loadData]);

  const ranked = useMemo<RankedLeaderboardRow[]>(() => {
    if (!round) return [];
    const rows = buildLeaderboard(players, scores, round.handicap_enabled);
    return rankLeaderboard(rows);
  }, [players, scores, round]);

  const eventName = round?.name ?? "Myrtle Beach Classic 2026";
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

  const leaderNet = ranked[0]?.netTotal ?? null;

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-slate-950 px-4 py-8 text-white">
      <div className="w-full max-w-4xl">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.6)] sm:p-6">
          <header className="flex flex-col gap-2 border-b border-slate-700/70 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Myrtle Beach Classic 2026
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

          <div className="mt-4 flex items-center justify-between border-b border-slate-700/70 px-4 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span className="w-12">Pos</span>
            <span className="flex-1 px-2">Player</span>
            <span className="w-16 text-right">Total</span>
            <span className="w-12 text-right">Thru</span>
            <span className="w-16 text-right">Today</span>
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
              const totalToPar = row.thru
                ? row.netTotal - parPerHole * row.thru
                : null;
              const todayToPar = totalToPar;
              const isLeader = leaderNet !== null && row.netTotal === leaderNet;
              const thruLabel = row.thru >= 18 ? "F" : row.thru || "-";
              return (
                <div
                  key={row.playerId}
                  className={`flex items-center justify-between border-b border-slate-700/70 px-4 py-2 text-sm sm:text-base ${
                    isLeader ? "bg-slate-800/80" : "bg-slate-900/80"
                  }`}
                >
                  <span className="w-12 text-base font-semibold text-white">
                    {row.position}
                  </span>
                  <span className="flex-1 px-2 font-semibold text-white">
                    {row.name}
                  </span>
                  <span className="w-16 text-right font-semibold text-white">
                    {totalToPar === null ? "-" : formatDelta(totalToPar)}
                  </span>
                  <span className="w-12 text-right text-slate-200">
                    {thruLabel}
                  </span>
                  <span className="w-16 text-right font-semibold text-slate-100">
                    {todayToPar === null ? "-" : formatDelta(todayToPar)}
                  </span>
                </div>
              );
            })}
          </div>

          <footer className="mt-3 flex justify-between px-4 text-xs text-slate-400">
            <span>Handicap adjusted</span>
            <span>Last updated: {lastUpdatedLabel}</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
