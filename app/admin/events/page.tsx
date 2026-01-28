import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";
import EventCreateForm from "./EventCreateForm";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export default async function AdminEventsPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  const events = (data ?? []) as EventRow[];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Events
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Event management
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Create and manage tournament events.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Events list
            </p>
            <span className="text-xs text-slate-500">
              {events.length} total
            </span>
          </div>
          {error ? (
            <p className="mt-4 text-sm text-rose-500">
              Unable to load events: {error.message}
            </p>
          ) : null}
          {events.length === 0 ? (
            <p className="mt-4 text-base text-slate-600">
              No events have been created yet.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Rounds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {event.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          href={`/admin/rounds?eventId=${event.id}`}
                        >
                          Manage rounds
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Add event</h3>
          <p className="mt-2 text-sm text-slate-600">
            Provide the public name and slug for the event.
          </p>
          <div className="mt-4">
            <EventCreateForm />
          </div>
        </div>
      </div>
    </section>
  );
}
