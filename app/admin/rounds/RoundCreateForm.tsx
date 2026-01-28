"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RoundCreateFormProps = {
  eventId: string;
};

export default function RoundCreateForm({ eventId }: RoundCreateFormProps) {
  const router = useRouter();
  const [roundNumber, setRoundNumber] = useState(1);
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [par, setPar] = useState(72);
  const [entryPin, setEntryPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/admin/api/rounds/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          round_number: Number(roundNumber),
          course: course || null,
          date: date || null,
          par: Number(par),
          entry_pin: entryPin || null
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to create round.");
      }

      setRoundNumber((prev) => prev + 1);
      setCourse("");
      setDate("");
      setEntryPin("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create round.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="round_number"
        >
          Round number
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="round_number"
          min={1}
          name="round_number"
          onChange={(event) => setRoundNumber(Number(event.target.value))}
          required
          type="number"
          value={roundNumber}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="course">
          Course name
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="course"
          name="course"
          onChange={(event) => setCourse(event.target.value)}
          type="text"
          value={course}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="date">
          Date
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="date"
          name="date"
          onChange={(event) => setDate(event.target.value)}
          type="date"
          value={date}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="par">
          Par
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="par"
          min={0}
          name="par"
          onChange={(event) => setPar(Number(event.target.value))}
          required
          type="number"
          value={par}
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="entry_pin"
        >
          Entry pin
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="entry_pin"
          name="entry_pin"
          onChange={(event) => setEntryPin(event.target.value)}
          type="text"
          value={entryPin}
        />
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : "Add round"}
      </button>
    </form>
  );
}
