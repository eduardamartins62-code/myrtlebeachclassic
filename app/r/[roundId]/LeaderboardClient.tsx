"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  buildLeaderboard,
  rankLeaderboard,
  type PlayerRow,
  type ScoreRow
} from "@/lib/leaderboard";

const formatDelta = (value: number) => {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
};

type RoundRow = {
  id: string;
  name: string | null;
  handicap_enabled: boolean;
};

type LeaderboardClientProps = {
  roundId: string;
};

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
        .select("id,name,handicap_enabled")
        .eq("id", roundId)
        .maybeSingle(),
      supabase.from("players").select("id,name,handicap").eq("round_id", roundId),
      supabase
        .from("scores")
        .select("player_id,hole_number,strokes")
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
    setScores(scoresRes.data ?? []);
    setLastUpdated(new Date());
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

  const ranked = useMemo(() => {
    if (!round) return [];
    const rows = buildLeaderboard(players, scores, round.handicap_enabled);
    return rankLeaderboard(rows);
  }, [players, scores, round]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2 rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
          Myrtle Beach Classic 2026
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Myrtle Beach Classic 2026 – Live Leaderboard
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold text-pine-700">
            {round?.name ?? "Round"}
          </span>
          {lastUpdated && (
            <span>Last updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="grid grid-cols-[2fr_repeat(3,1fr)_0.8fr] gap-3 border-b border-slate-100 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <span>Player</span>
          <span className="text-right">Gross</span>
          <span className="text-right">Net</span>
          <span className="text-right">Thru</span>
          <span className="text-right">+/-</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading && (
            <div className="py-6 text-center text-sm text-slate-500">
              Loading leaderboard...
            </div>
          )}

          {!loading && ranked.length === 0 && (
            <div className="py-6 text-center text-sm text-slate-500">
              No players yet. Add players in the admin panel.
            </div>
          )}

          {ranked.map((row) => (
            <div
              key={row.playerId}
              className="grid grid-cols-[2fr_repeat(3,1fr)_0.8fr] items-center gap-3 py-4 text-sm"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {row.name}
                </p>
                <p className="text-xs text-slate-500">Rank #{row.rank}</p>
              </div>
              <p className="text-right font-semibold text-slate-700">
                {row.grossTotal || "-"}
              </p>
              <p className="text-right font-semibold text-slate-900">
                {row.netTotal || "-"}
              </p>
              <p className="text-right text-slate-600">
                {row.thru || "-"}
              </p>
              <p
                className={`text-right font-semibold ${
                  row.leaderDelta === 0
                    ? "text-pine-600"
                    : row.leaderDelta > 0
                    ? "text-red-500"
                    : "text-pine-600"
                }`}
              >
                {formatDelta(row.leaderDelta)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
