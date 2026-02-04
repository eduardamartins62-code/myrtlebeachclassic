"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PlayerCreateFormProps = {
  eventId: string;
};

export default function PlayerCreateForm({ eventId }: PlayerCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [handicap, setHandicap] = useState(0);
  const [startingScore, setStartingScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/admin/api/players/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          name,
          nickname: nickname || null,
          image_url: imageUrl || null,
          handicap,
          starting_score: startingScore
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to create player.");
      }

      setName("");
      setNickname("");
      setImageUrl("");
      setHandicap(0);
      setStartingScore(0);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create player.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="name">
          Name
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="name"
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          type="text"
          value={name}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="nickname"
          >
            Nickname
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            id="nickname"
            name="nickname"
            onChange={(event) => setNickname(event.target.value)}
            type="text"
            value={nickname}
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="imageUrl"
          >
            Avatar image URL
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            id="imageUrl"
            name="imageUrl"
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://"
            type="url"
            value={imageUrl}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="handicap"
          >
            Handicap
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            id="handicap"
            min={0}
            name="handicap"
            onChange={(event) => setHandicap(Number(event.target.value))}
            type="number"
            value={handicap}
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="startingScore"
          >
            Starting score
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            id="startingScore"
            min={0}
            name="startingScore"
            onChange={(event) => setStartingScore(Number(event.target.value))}
            type="number"
            value={startingScore}
          />
        </div>
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : "Create player"}
      </button>
    </form>
  );
}
