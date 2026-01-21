import AdminClient from "./AdminClient";
import { EVENT_SLUG } from "@/lib/event";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type EventRow = {
  id: string;
  name: string;
  slug: string;
};

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  let event: EventRow | null = null;
  const { data: createdEvent } = await supabase
    .from("events")
    .select("id,name,slug")
    .eq("slug", EVENT_SLUG)
    .maybeSingle();

  event = createdEvent ?? null;

  if (!event) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Event unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We couldn&apos;t load the event details. Please try again in a bit.
          </p>
        </div>
      </main>
    );
  }

  return <AdminClient />;
}
