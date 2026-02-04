"use client";

import { useMemo, useState, useTransition } from "react";
import type { Database } from "@/lib/database.types";
import { updateHolePar, updateScore } from "./actions";

type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];
type RoundHoleRow = Database["public"]["Tables"]["round_holes"]["Row"];
type RoundPlayerRow = Database["public"]["Tables"]["round_players"]["Row"];
type ScoreRow = Database["public"]["Tables"]["scores"]["Row"];

type RoundScoreEditorProps = {
  eventId: string;
  round: RoundRow;
  players: PlayerRow[];
  roundPlayers: RoundPlayerRow[];
  holes: RoundHoleRow[];
  scores: ScoreRow[];
};

const holeNumbers = Array.from({ length: 18 }, (_, index) => index + 1);

const getResultLabel = (strokes: number, par: number) => {
  const diff = strokes - par;
  if (diff <= -3) return "Albatross";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  return "Bogey";
};

const getToParLabel = (value: number | null) => {
  if (value === null) return "-";
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
};

export default function RoundScoreEditor({
  eventId,
  round,
  players,
  roundPlayers,
  holes,
  scores
}: RoundScoreEditorProps) {
  const assignedPlayerIds = useMemo(
    () => new Set(roundPlayers.map((assignment) => assignment.player_id)),
    [roundPlayers]
  );

  const visiblePlayers =
    assignedPlayerIds.size > 0
      ? players.filter((player) => assignedPlayerIds.has(player.id))
      : players;

  const [parByHole, setParByHole] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    holes.forEach((hole) => {
      initial[hole.hole_number] = hole.par;
    });
    holeNumbers.forEach((holeNumber) => {
      if (!initial[holeNumber]) {
        initial[holeNumber] = 4;
      }
    });
    return initial;
  });

  const [scoreByKey, setScoreByKey] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    scores.forEach((score) => {
      initial[`${score.player_id}-${score.hole_number}`] = String(
        score.strokes
      );
    });
    return initial;
  });

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleScoreBlur = (
    playerId: string,
    holeNumber: number,
    value: string
  ) => {
    setError(null);
    const trimmed = value.trim();

    startTransition(async () => {
      if (!trimmed) {
        const result = await updateScore({
          eventId,
          roundId: round.id,
          playerId,
          holeNumber,
          strokes: null
        });
        if (!result.ok) {
          setError(result.error ?? "Unable to clear score.");
        }
        return;
      }

      const strokes = Number(trimmed);
      if (Number.isNaN(strokes) || strokes <= 0) {
        setError("Scores must be positive numbers.");
        return;
      }

      const result = await updateScore({
        eventId,
        roundId: round.id,
        playerId,
        holeNumber,
        strokes
      });
      if (!result.ok) {
        setError(result.error ?? "Unable to save score.");
      }
    });
  };

  const handleParChange = (holeNumber: number, value: string) => {
    const par = Number(value);
    if (Number.isNaN(par)) return;
    setParByHole((prev) => ({ ...prev, [holeNumber]: par }));
    startTransition(async () => {
      const result = await updateHolePar({
        eventId,
        roundId: round.id,
        holeNumber,
        par
      });
      if (!result.ok) {
        setError(result.error ?? "Unable to update hole par.");
      }
    });
  };

  const totalsByPlayer = useMemo(() => {
    const totals = new Map<
      string,
      { strokes: number | null; toPar: number | null }
    >();
    visiblePlayers.forEach((player) => {
      let totalStrokes = 0;
      let totalPar = 0;
      let hasScores = false;
      holeNumbers.forEach((hole) => {
        const value = scoreByKey[`${player.id}-${hole}`];
        if (value) {
          const strokes = Number(value);
          if (!Number.isNaN(strokes)) {
            totalStrokes += strokes;
            totalPar += parByHole[hole] ?? 4;
            hasScores = true;
          }
        }
      });
      totals.set(player.id, {
        strokes: hasScores ? totalStrokes : null,
        toPar: hasScores ? totalStrokes - totalPar : null
      });
    });
    return totals;
  }, [scoreByKey, parByHole, visiblePlayers]);

  if (visiblePlayers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-base text-slate-600">
          No players are assigned to this round yet. Assign players from the
          event roster.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Hole par setup
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          {holeNumbers.map((hole) => (
            <label
              key={hole}
              className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Hole {hole}
              <select
                className="rounded-xl border border-slate-200 px-2 py-2 text-sm font-semibold text-slate-700"
                onChange={(event) => handleParChange(hole, event.target.value)}
                value={parByHole[hole]}
              >
                {[3, 4, 5].map((par) => (
                  <option key={par} value={par}>
                    Par {par}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Player scoring
          </p>
          <p className="text-xs text-slate-500">
            {isPending ? "Saving updates..." : "Autosave on blur"}
          </p>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
        <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Player</th>
                {holeNumbers.map((hole) => (
                  <th key={hole} className="px-2 py-3 text-center">
                    H{hole}
                    <div className="text-[10px] text-slate-400">
                      Par {parByHole[hole]}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center">Total</th>
                <th className="px-3 py-3 text-center">To par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {visiblePlayers.map((player) => {
                const totals = totalsByPlayer.get(player.id);
                return (
                  <tr key={player.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      <div>{player.name}</div>
                      <div className="text-[10px] uppercase text-slate-400">
                        Handicap {player.handicap} • Start {player.starting_score}
                      </div>
                    </td>
                    {holeNumbers.map((hole) => {
                      const key = `${player.id}-${hole}`;
                      const value = scoreByKey[key] ?? "";
                      const strokes = value ? Number(value) : null;
                      return (
                        <td key={key} className="px-2 py-3 text-center">
                          <input
                            className="w-12 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
                            min={1}
                            onBlur={(event) =>
                              handleScoreBlur(
                                player.id,
                                hole,
                                event.target.value
                              )
                            }
                            onChange={(event) =>
                              setScoreByKey((prev) => ({
                                ...prev,
                                [key]: event.target.value
                              }))
                            }
                            type="number"
                            value={value}
                          />
                          {strokes ? (
                            <div className="mt-1 text-[10px] font-semibold uppercase text-slate-400">
                              {getResultLabel(strokes, parByHole[hole])}
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-slate-300">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center text-sm font-semibold text-slate-900">
                      {totals?.strokes ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                      {getToParLabel(totals?.toPar ?? null)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
