"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/lib/database.types";
import PlayerAssignmentForm from "./PlayerAssignmentForm";

type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];

type PlayerEditCardProps = {
  eventId: string;
  player: PlayerRow;
  rounds: RoundRow[];
  assignedRoundIds: string[];
};

export default function PlayerEditCard({
  eventId,
  player,
  rounds,
  assignedRoundIds
}: PlayerEditCardProps) {
  const router = useRouter();
  const [name, setName] = useState(player.name);
  const [nickname, setNickname] = useState(player.nickname ?? "");
  const [imageUrl, setImageUrl] = useState(player.image_url ?? "");
  const [handicap, setHandicap] = useState(player.handicap ?? 0);
  const [startingScore, setStartingScore] = useState(
    player.starting_score ?? 0
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/admin/api/players/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: player.id,
          name,
          nickname: nickname || null,
          image_url: imageUrl || null,
          handicap,
          starting_score: startingScore
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to update player.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update player.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
            {player.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={player.name}
                className="h-full w-full object-cover"
                src={player.image_url}
              />
            ) : (
              <span className="text-xs font-semibold text-slate-400">N/A</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {player.name}
            </p>
            <p className="text-xs text-slate-500">
              {player.nickname ?? "No nickname"}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Added {new Date(player.created_at).toLocaleDateString()}
        </p>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              htmlFor={`player-name-${player.id}`}
            >
              Name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              id={`player-name-${player.id}`}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              htmlFor={`player-nickname-${player.id}`}
            >
              Nickname
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              id={`player-nickname-${player.id}`}
              onChange={(event) => setNickname(event.target.value)}
              type="text"
              value={nickname}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              htmlFor={`player-image-${player.id}`}
            >
              Avatar URL
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              id={`player-image-${player.id}`}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://"
              type="url"
              value={imageUrl}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              htmlFor={`player-handicap-${player.id}`}
            >
              Handicap
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              id={`player-handicap-${player.id}`}
              min={0}
              onChange={(event) => setHandicap(Number(event.target.value))}
              type="number"
              value={handicap}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              htmlFor={`player-starting-${player.id}`}
            >
              Starting score
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              id={`player-starting-${player.id}`}
              min={0}
              onChange={(event) => setStartingScore(Number(event.target.value))}
              type="number"
              value={startingScore}
            />
          </div>
        </div>
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <button
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : "Save player"}
        </button>
      </form>

      <div className="mt-4">
        <PlayerAssignmentForm
          assignedRoundIds={assignedRoundIds}
          eventId={eventId}
          playerId={player.id}
          rounds={rounds}
        />
      </div>
    </div>
  );
}
