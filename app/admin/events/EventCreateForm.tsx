"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { CreateEventState } from "./page";

type EventCreateFormProps = {
  action: (
    prevState: CreateEventState,
    formData: FormData
  ) => Promise<CreateEventState>;
};

const initialState: CreateEventState = { ok: false, error: null };

function SubmitButton({ hasEdits }: { hasEdits: boolean }) {
  const { pending } = useFormStatus();
  const isSubmitting = pending && hasEdits;

  return (
    <button
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {isSubmitting ? "Saving..." : "Add event"}
    </button>
  );
}

export default function EventCreateForm({ action }: EventCreateFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [hasEdits, setHasEdits] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setName("");
      setSlug("");
      setHasEdits(false);
    }
  }, [state.ok]);

  return (
    <form className="space-y-4" action={formAction}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="name">
          Name
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="name"
          name="name"
          onChange={(event) => {
            setName(event.target.value);
            setHasEdits(true);
          }}
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
          onChange={(event) => {
            setSlug(event.target.value);
            setHasEdits(true);
          }}
          required
          type="text"
          value={slug}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-rose-500">{state.error}</p>
      ) : null}
      {state.ok && !hasEdits ? (
        <p className="text-sm text-emerald-600">
          Event created successfully.
        </p>
      ) : null}
      <SubmitButton hasEdits={hasEdits} />
    </form>
  );
}
