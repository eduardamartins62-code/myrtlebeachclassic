"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/types/supabase";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

type PlayerCreateFormProps = {
  events: EventRow[];
};

export default function PlayerCreateForm({ events }: PlayerCreateFormProps) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
          image_url: imageUrl || null
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to create player.");
      }

      setName("");
      setNickname("");
      setImageUrl("");
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
        <label className="text-sm font-semibold text-slate-700" htmlFor="event">
          Event
        </label>
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="event"
          name="event"
          onChange={(event) => setEventId(event.target.value)}
          required
          value={eventId}
        >
          {events.length === 0 ? (
            <option value="">No events available</option>
          ) : (
            events.map((eventRow) => (
              <option key={eventRow.id} value={eventRow.id}>
                {eventRow.name}
              </option>
            ))
          )}
        </select>
      </div>
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
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || events.length === 0}
        type="submit"
      >
        {isSubmitting ? "Saving..." : "Create player"}
      </button>
    </form>
  );
}
