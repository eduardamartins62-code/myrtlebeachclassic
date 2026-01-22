"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/app/components/AdminShell";
import AdminLogoutButton from "@/app/components/AdminLogoutButton";
import type { Database } from "@/types/supabase";

type PastEventRow = Database["public"]["Tables"]["past_events"]["Row"];

type HistoryAdminClientProps = {
  initialEvents: PastEventRow[];
};

const createEmptyForm = (): Omit<PastEventRow, "id" | "created_at" | "updated_at"> => ({
  year: new Date().getFullYear(),
  title: "",
  summary: "",
  winner_name: "",
  runner_up_name: "",
  total_players: null,
  notable_courses: "",
  highlight_notes: "",
  is_published: true
});

export default function HistoryAdminClient({
  initialEvents
}: HistoryAdminClientProps) {
  const [events, setEvents] = useState<PastEventRow[]>(initialEvents);
  const [form, setForm] = useState(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      showToast("Enter a title and summary.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/admin/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        title: form.title.trim(),
        summary: form.summary.trim(),
        winner_name: form.winner_name?.trim() || null,
        runner_up_name: form.runner_up_name?.trim() || null,
        notable_courses: form.notable_courses?.trim() || null,
        highlight_notes: form.highlight_notes?.trim() || null
      })
    });

    const payload = (await response.json()) as {
      event?: PastEventRow;
      error?: string;
    };

    if (!response.ok || !payload.event) {
      showToast(payload.error ?? "Unable to create past event.");
      setLoading(false);
      return;
    }

    setEvents((prev) => [payload.event as PastEventRow, ...prev]);
    setForm(createEmptyForm());
    showToast("Past event created.");
    setLoading(false);
  };

  const handleUpdate = async (eventItem: PastEventRow) => {
    setLoading(true);
    const response = await fetch("/api/admin/history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...eventItem,
        title: eventItem.title.trim(),
        summary: eventItem.summary.trim(),
        winner_name: eventItem.winner_name?.trim() || null,
        runner_up_name: eventItem.runner_up_name?.trim() || null,
        notable_courses: eventItem.notable_courses?.trim() || null,
        highlight_notes: eventItem.highlight_notes?.trim() || null
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      showToast(payload.error ?? "Unable to update past event.");
      setLoading(false);
      return;
    }

    showToast("Past event updated.");
    setLoading(false);
  };

  const handleDelete = async (eventId: string) => {
    const confirmed = window.confirm("Delete this past event?");
    if (!confirmed) return;

    setLoading(true);
    const response = await fetch("/api/admin/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: eventId })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      showToast(payload.error ?? "Unable to delete past event.");
      setLoading(false);
      return;
    }

    setEvents((prev) => prev.filter((item) => item.id !== eventId));
    showToast("Past event deleted.");
    setLoading(false);
  };

  const updateEvent = (eventId: string, patch: Partial<PastEventRow>) => {
    setEvents((prev) =>
      prev.map((item) => (item.id === eventId ? { ...item, ...patch } : item))
    );
  };

  return (
    <AdminShell
      title="History Management"
      subtitle="Admin Portal"
      description="Manage past event summaries and highlights."
      backLinkLabel="Back to admin"
      backLinkHref="/admin"
      actions={<AdminLogoutButton />}
    >
      {toast && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {toast}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Create past event
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Publish a new year for the history page.
            </p>
          </div>
          <Link
            className="text-xs font-semibold uppercase tracking-[0.2em] text-pine-600"
            href="/history"
          >
            View public history
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Year
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              type="number"
              value={form.year}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  year: Number(event.target.value)
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Title
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-slate-600">
          Summary
          <textarea
            className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900"
            value={form.summary}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, summary: event.target.value }))
            }
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Winner name
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              value={form.winner_name ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  winner_name: event.target.value
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Runner-up name
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              value={form.runner_up_name ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  runner_up_name: event.target.value
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Total players
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              type="number"
              value={form.total_players ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  total_players: event.target.value
                    ? Number(event.target.value)
                    : null
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Notable courses
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              value={form.notable_courses ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  notable_courses: event.target.value
                }))
              }
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-slate-600">
          Highlight notes
          <input
            className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
            value={form.highlight_notes ?? ""}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                highlight_notes: event.target.value
              }))
            }
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                is_published: event.target.checked
              }))
            }
          />
          Published
        </label>
        <button
          className="mt-4 h-12 rounded-2xl bg-pine-600 px-6 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
          disabled={loading}
          onClick={handleCreate}
          type="button"
        >
          {loading ? "Saving..." : "Create past event"}
        </button>
      </section>

      <section className="grid gap-6">
        {events.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No past events yet.
          </div>
        )}
        {events.map((eventItem) => (
          <div
            key={eventItem.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Year
                <input
                  className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                  type="number"
                  value={eventItem.year}
                  onChange={(event) =>
                    updateEvent(eventItem.id, {
                      year: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Title
                <input
                  className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={eventItem.title}
                  onChange={(event) =>
                    updateEvent(eventItem.id, { title: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="mt-3 flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Summary
              <textarea
                className="min-h-[100px] rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={eventItem.summary}
                onChange={(event) =>
                  updateEvent(eventItem.id, { summary: event.target.value })
                }
              />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Winner name
                <input
                  className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={eventItem.winner_name ?? ""}
                  onChange={(event) =>
                    updateEvent(eventItem.id, {
                      winner_name: event.target.value
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Runner-up name
                <input
                  className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={eventItem.runner_up_name ?? ""}
                  onChange={(event) =>
                    updateEvent(eventItem.id, {
                      runner_up_name: event.target.value
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Total players
                <input
                  className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                  type="number"
                  value={eventItem.total_players ?? ""}
                  onChange={(event) =>
                    updateEvent(eventItem.id, {
                      total_players: event.target.value
                        ? Number(event.target.value)
                        : null
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Notable courses
                <input
                  className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={eventItem.notable_courses ?? ""}
                  onChange={(event) =>
                    updateEvent(eventItem.id, {
                      notable_courses: event.target.value
                    })
                  }
                />
              </label>
            </div>
            <label className="mt-3 flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Highlight notes
              <input
                className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                value={eventItem.highlight_notes ?? ""}
                onChange={(event) =>
                  updateEvent(eventItem.id, {
                    highlight_notes: event.target.value
                  })
                }
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <input
                type="checkbox"
                checked={eventItem.is_published}
                onChange={(event) =>
                  updateEvent(eventItem.id, {
                    is_published: event.target.checked
                  })
                }
              />
              Published
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="h-9 rounded-2xl bg-pine-600 px-4 text-xs font-semibold text-white"
                onClick={() => handleUpdate(eventItem)}
                type="button"
              >
                Save changes
              </button>
              <button
                className="h-9 rounded-2xl border border-red-200 px-4 text-xs font-semibold text-red-500"
                onClick={() => handleDelete(eventItem.id)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
