"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EventCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/admin/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to create event.");
      }

      setName("");
      setSlug("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create event.");
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
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="slug">
          Slug
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="slug"
          name="slug"
          onChange={(event) => setSlug(event.target.value)}
          required
          type="text"
          value={slug}
        />
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : "Add event"}
      </button>
    </form>
  );
}
