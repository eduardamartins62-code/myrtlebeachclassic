"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/app/components/AdminShell";
import AdminLogoutButton from "@/app/components/AdminLogoutButton";
import type { Database } from "@/types/supabase";

type ItineraryItem =
  Database["public"]["Tables"]["itinerary_items"]["Row"];

type ItineraryAdminClientProps = {
  initialItems: ItineraryItem[];
};

const categories = [
  { value: "HOTEL", label: "Hotel" },
  { value: "GOLF", label: "Golf" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "NIGHTLIFE", label: "Nightlife" },
  { value: "OTHER", label: "Other" }
];

const formatDateTimeLocal = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

const toIsoString = (value: string) =>
  value ? new Date(value).toISOString() : null;

const createEmptyForm = (): Omit<ItineraryItem, "id" | "created_at" | "updated_at"> => ({
  category: "GOLF",
  title: "",
  description: "",
  address: "",
  website_url: "",
  start_time: null,
  end_time: null,
  day_label: "",
  sort_order: 0,
  is_active: true
});

export default function ItineraryAdminClient({
  initialItems
}: ItineraryAdminClientProps) {
  const [items, setItems] = useState<ItineraryItem[]>(initialItems);
  const [form, setForm] = useState(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ItineraryItem[]>();
    items.forEach((item) => {
      const key = item.day_label ?? "Trip Highlights";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(item);
    });
    return Array.from(groups.entries());
  }, [items]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      showToast("Enter a title.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/admin/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        address: form.address?.trim() || null,
        website_url: form.website_url?.trim() || null,
        day_label: form.day_label?.trim() || null,
        start_time: form.start_time,
        end_time: form.end_time
      })
    });

    const payload = (await response.json()) as {
      item?: ItineraryItem;
      error?: string;
    };

    if (!response.ok || !payload.item) {
      showToast(payload.error ?? "Unable to create item.");
      setLoading(false);
      return;
    }

    setItems((prev) => [...prev, payload.item as ItineraryItem]);
    setForm(createEmptyForm());
    showToast("Itinerary item created.");
    setLoading(false);
  };

  const handleUpdate = async (item: ItineraryItem) => {
    setLoading(true);
    const response = await fetch("/api/admin/itinerary", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        description: item.description?.trim() || null,
        address: item.address?.trim() || null,
        website_url: item.website_url?.trim() || null,
        day_label: item.day_label?.trim() || null
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      showToast(payload.error ?? "Unable to update item.");
      setLoading(false);
      return;
    }

    showToast("Item updated.");
    setLoading(false);
  };

  const handleDelete = async (itemId: string) => {
    const confirmed = window.confirm("Delete this itinerary item?");
    if (!confirmed) return;

    setLoading(true);
    const response = await fetch("/api/admin/itinerary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      showToast(payload.error ?? "Unable to delete item.");
      setLoading(false);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
    showToast("Item deleted.");
    setLoading(false);
  };

  const updateItem = (
    itemId: string,
    patch: Partial<ItineraryItem>
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );
  };

  return (
    <AdminShell
      title="Itinerary Management"
      subtitle="Admin Portal"
      description="Create and update trip details for the week."
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
              Create new item
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a hotel, restaurant, or activity for the itinerary.
            </p>
          </div>
          <Link
            className="text-xs font-semibold uppercase tracking-[0.2em] text-pine-600"
            href="/itinerary"
          >
            View public itinerary
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Category
            <select
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  category: event.target.value
                }))
              }
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Day label
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              placeholder="Day 1 - Arrival"
              value={form.day_label ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, day_label: event.target.value }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Sort order
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              type="number"
              value={form.sort_order ?? 0}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: Number(event.target.value)
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Start time
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              type="datetime-local"
              value={formatDateTimeLocal(form.start_time)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  start_time: toIsoString(event.target.value)
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            End time
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              type="datetime-local"
              value={formatDateTimeLocal(form.end_time)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  end_time: toIsoString(event.target.value)
                }))
              }
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-slate-600">
          Description
          <textarea
            className="min-h-[100px] rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900"
            value={form.description ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Address
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              value={form.address ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Website URL
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900"
              value={form.website_url ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  website_url: event.target.value
                }))
              }
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                is_active: event.target.checked
              }))
            }
          />
          Active
        </label>
        <button
          className="mt-4 h-12 rounded-2xl bg-pine-600 px-6 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
          disabled={loading}
          onClick={handleCreate}
          type="button"
        >
          {loading ? "Saving..." : "Create item"}
        </button>
      </section>

      <section className="grid gap-6">
        {groupedItems.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No itinerary items yet.
          </div>
        )}
        {groupedItems.map(([dayLabel, dayItems]) => (
          <div
            key={dayLabel}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {dayLabel}
            </h3>
            <div className="mt-4 grid gap-4">
              {dayItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      Title
                      <input
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        value={item.title}
                        onChange={(event) =>
                          updateItem(item.id, { title: event.target.value })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      Category
                      <select
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        value={item.category}
                        onChange={(event) =>
                          updateItem(item.id, { category: event.target.value })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      Day label
                      <input
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        value={item.day_label ?? ""}
                        onChange={(event) =>
                          updateItem(item.id, {
                            day_label: event.target.value
                          })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      Sort order
                      <input
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        type="number"
                        value={item.sort_order ?? 0}
                        onChange={(event) =>
                          updateItem(item.id, {
                            sort_order: Number(event.target.value)
                          })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      Start time
                      <input
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        type="datetime-local"
                        value={formatDateTimeLocal(item.start_time)}
                        onChange={(event) =>
                          updateItem(item.id, {
                            start_time: toIsoString(event.target.value)
                          })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      End time
                      <input
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        type="datetime-local"
                        value={formatDateTimeLocal(item.end_time)}
                        onChange={(event) =>
                          updateItem(item.id, {
                            end_time: toIsoString(event.target.value)
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="mt-3 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Description
                    <textarea
                      className="min-h-[80px] rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      value={item.description ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, {
                          description: event.target.value
                        })
                      }
                    />
                  </label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      Address
                      <input
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        value={item.address ?? ""}
                        onChange={(event) =>
                          updateItem(item.id, { address: event.target.value })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                      Website URL
                      <input
                        className="h-10 rounded-2xl border border-slate-200 px-3 text-sm text-slate-900"
                        value={item.website_url ?? ""}
                        onChange={(event) =>
                          updateItem(item.id, {
                            website_url: event.target.value
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) =>
                        updateItem(item.id, {
                          is_active: event.target.checked
                        })
                      }
                    />
                    Active
                  </label>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="h-9 rounded-2xl bg-pine-600 px-4 text-xs font-semibold text-white"
                      onClick={() => handleUpdate(item)}
                      type="button"
                    >
                      Save changes
                    </button>
                    <button
                      className="h-9 rounded-2xl border border-red-200 px-4 text-xs font-semibold text-red-500"
                      onClick={() => handleDelete(item.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
