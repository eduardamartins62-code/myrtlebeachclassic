import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import RoundScoreEditor from "./RoundScoreEditor";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
type RoundHoleRow = Database["public"]["Tables"]["round_holes"]["Row"];
type RoundPlayerRow = Database["public"]["Tables"]["round_players"]["Row"];
type ScoreRow = Database["public"]["Tables"]["scores"]["Row"];

type AdminRoundScoresProps = {
  params: { eventId: string; roundId: string };
};

export default async function AdminRoundScoresPage({
  params
}: AdminRoundScoresProps) {
  const supabaseAdmin = getSupabaseAdmin();
  const { eventId, roundId } = params;

  const [
    { data: eventData },
    { data: roundData },
    { data: playersData },
    { data: holesData },
    { data: roundPlayersData },
    { data: scoresData }
  ] = await Promise.all([
    supabaseAdmin.from("events").select("id, name").eq("id", eventId),
    supabaseAdmin
      .from("rounds")
      .select("id, event_id, round_number, course, date, par")
      .eq("id", roundId)
      .eq("event_id", eventId),
    supabaseAdmin
      .from("players")
      .select(
        "id, event_id, name, nickname, image_url, handicap, starting_score, created_at"
      )
      .eq("event_id", eventId)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("round_holes")
      .select("id, round_id, hole_number, par")
      .eq("round_id", roundId),
    supabaseAdmin
      .from("round_players")
      .select("id, round_id, player_id")
      .eq("round_id", roundId),
    supabaseAdmin
      .from("scores")
      .select("id, round_id, player_id, hole_number, strokes, updated_at")
      .eq("round_id", roundId)
  ]);

  const event = (eventData ?? [])[0] as EventRow | undefined;
  const round = (roundData ?? [])[0] as RoundRow | undefined;

  if (!event || !round) {
    notFound();
  }

  const players = (playersData ?? []) as PlayerRow[];
  const holes = (holesData ?? []) as RoundHoleRow[];
  const roundPlayers = (roundPlayersData ?? []) as RoundPlayerRow[];
  const scores = (scoresData ?? []) as ScoreRow[];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Round scoring
        </p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {event.name} • Round {round.round_number}
            </h2>
            <p className="mt-2 text-base text-slate-600">
              {round.course ?? "Course TBD"} •{" "}
              {round.date
                ? new Date(round.date).toLocaleDateString()
                : "Date TBD"}{" "}
              • Round par {round.par}
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            href={`/admin/events/${event.id}`}
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <RoundScoreEditor
        eventId={event.id}
        holes={holes}
        players={players}
        round={round}
        roundPlayers={roundPlayers}
        scores={scores}
      />
    </section>
  );
}
