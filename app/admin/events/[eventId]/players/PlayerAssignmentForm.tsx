"use client";

import { useState, useTransition } from "react";
import { updatePlayerAssignments } from "./actions";
import type { Database } from "@/lib/database.types";

type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];

type PlayerAssignmentFormProps = {
  eventId: string;
  playerId: string;
  rounds: RoundRow[];
  assignedRoundIds: string[];
};

export default function PlayerAssignmentForm({
  eventId,
  playerId,
  rounds,
  assignedRoundIds
}: PlayerAssignmentFormProps) {
  const [selectedRounds, setSelectedRounds] = useState<string[]>(
    assignedRoundIds
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleRound = (roundId: string) => {
    setSelectedRounds((prev) =>
      prev.includes(roundId)
        ? prev.filter((id) => id !== roundId)
        : [...prev, roundId]
    );
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updatePlayerAssignments({
        eventId,
        playerId,
        roundIds: selectedRounds
      });

      if (!result.ok) {
        setError(result.error ?? "Unable to update assignments.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Assign rounds
      </p>
      {rounds.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No rounds are available for this event yet.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {rounds.map((round) => (
            <label
              key={round.id}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                checked={selectedRounds.includes(round.id)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
                onChange={() => toggleRound(round.id)}
                type="checkbox"
              />
              <span>
                Round {round.round_number} • {round.course ?? "Course TBD"}
              </span>
            </label>
          ))}
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
      <button
        className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || rounds.length === 0}
        onClick={handleSave}
        type="button"
      >
        {isPending ? "Saving..." : "Save assignments"}
      </button>
    </div>
  );
}
