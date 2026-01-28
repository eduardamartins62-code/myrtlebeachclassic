"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/types/supabase";

type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

type PlayerEditFormProps = {
  player: PlayerRow;
};

export default function PlayerEditForm({ player }: PlayerEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(player.name);
  const [nickname, setNickname] = useState(player.nickname ?? "");
  const [imageUrl, setImageUrl] = useState(player.image_url ?? "");
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
          image_url: imageUrl || null
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
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
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
        <div className="space-y-2">
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
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <button
        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
