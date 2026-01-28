"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createItineraryItem } from "./actions";

type ItineraryCreateFormProps = {
  eventId: string;
  categoryOptions: string[];
};

type ActionState = {
  ok: boolean;
  error: string;
};

const initialState: ActionState = { ok: true, error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Add item"}
    </button>
  );
}

export default function ItineraryCreateForm({
  eventId,
  categoryOptions
}: ItineraryCreateFormProps) {
  const [state, formAction] = useFormState(createItineraryItem, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="event_id" type="hidden" value={eventId} />
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="day_label">
          Day label
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="day_label"
          name="day_label"
          placeholder="Thursday – Arrival"
          type="text"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="category">
          Category
        </label>
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="category"
          name="category"
          required
        >
          <option value="">Select a category</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="title">
          Title
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="title"
          name="title"
          required
          type="text"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="description">
          Description
        </label>
        <textarea
          className="min-h-[110px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="description"
          name="description"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="address">
          Address
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="address"
          name="address"
          type="text"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="website_url">
          External / Map URL
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="website_url"
          name="website_url"
          type="url"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="sort_order">
          Display order
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          id="sort_order"
          name="sort_order"
          type="number"
        />
      </div>
      {state.error ? <p className="text-sm text-rose-500">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
