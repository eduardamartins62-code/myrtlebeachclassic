"use client";

import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

type EventSelectorProps = {
  events: EventRow[];
  selectedEventId: string;
};

export default function EventSelector({
  events,
  selectedEventId
}: EventSelectorProps) {
  const router = useRouter();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = event.target.value;
    const nextUrl = eventId ? `/admin/itinerary?eventId=${eventId}` : "/admin/itinerary";
    router.push(nextUrl);
  };

  return (
    <select
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      onChange={handleChange}
      value={selectedEventId}
    >
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))}
    </select>
  );
}
