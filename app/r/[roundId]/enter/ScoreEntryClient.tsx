"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const holes = Array.from({ length: 18 }, (_, index) => index + 1);

const showToastTimeout = 3000;

type RoundRow = {
  id: string;
  name: string | null;
  round_number: number | null;
  entry_pin: string | null;
  handicap_enabled: boolean;
  event_id: string;
  course: string | null;
};

type EventRow = {
  id: string;
  name: string;
};

type PlayerRow = {
  id: string;
  name: string;
  handicap: number;
};

type ScoreRow = {
  player_id: string;
  hole_number: number;
  strokes: number;
};

export default function ScoreEntryClient({ roundId }: { roundId: string }) {
  const [round, setRound] = useState<RoundRow | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedHole, setSelectedHole] = useState(1);
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "ok" | "error";
  } | null>(null);

  const showToast = useCallback((message: string, tone: "ok" | "error") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), showToastTimeout);
  }, []);

  const loadRound = useCallback(async () => {
    setLoading(true);
    const roundRes = await supabase
      .from("rounds")
      .select(
        "id,name,round_number,entry_pin,handicap_enabled,event_id,course"
      )
      .eq("id", roundId)
      .maybeSingle();

    if (roundRes.error || !roundRes.data) {
      showToast("Unable to load round.", "error");
      setLoading(false);
      return;
    }

    const [eventRes, playersRes, userRes] = await Promise.all([
      supabase
        .from("events")
        .select("id,name")
        .eq("id", roundRes.data.event_id)
        .maybeSingle(),
      supabase
        .from("players")
        .select("id,name,handicap")
        .eq("event_id", roundRes.data.event_id)
        .order("name", { ascending: true }),
      supabase.auth.getUser()
    ]);

    setRound(roundRes.data as RoundRow);
    setEvent(eventRes.data ?? null);
    const playerRows = (playersRes.data ?? []) as Array<{
      id: string;
      name: string;
      handicap: number | null;
    }>;
    setPlayers(
      playerRows.map((player) => ({
        id: player.id,
        name: player.name,
        handicap: player.handicap ?? 0
      }))
    );

    if (userRes.data.user) {
      const adminRes = await supabase
        .from("admins")
        .select("user_id")
        .eq("event_id", roundRes.data.event_id)
        .eq("user_id", userRes.data.user.id)
        .maybeSingle();
      setIsAdmin(Boolean(adminRes.data));
    } else {
      setIsAdmin(false);
    }

    setLoading(false);
  }, [roundId, showToast]);

  const loadScores = useCallback(async () => {
    const { data, error } = await supabase
      .from("scores")
      .select("player_id,hole_number,strokes")
      .eq("round_id", roundId)
      .eq("hole_number", selectedHole);

    if (error) {
      showToast("Unable to load scores for this hole.", "error");
      return;
    }

    const nextScores: Record<string, number> = {};
    const scoreRows = (data ?? []) as ScoreRow[];
    scoreRows.forEach((score) => {
      nextScores[score.player_id] = score.strokes;
    });
    setScores(nextScores);
  }, [roundId, selectedHole, showToast]);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  useEffect(() => {
    if (round) {
      void loadScores();
    }
  }, [round, loadScores]);

  const isPinRequired = useMemo(() => Boolean(round?.entry_pin), [round]);

  const handlePinSubmit = () => {
    if (!round) return;
    if (!round.entry_pin || pin.trim() === round.entry_pin) {
      setAuthorized(true);
      showToast("PIN accepted. You can enter scores now.", "ok");
      return;
    }
    showToast("Incorrect PIN. Try again.", "error");
  };

  const handleScoreChange = (playerId: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setScores((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
      return;
    }
    setScores((prev) => ({
      ...prev,
      [playerId]: Math.max(1, Math.min(20, parsed))
    }));
  };

  const handleSave = async () => {
    if (!round) return;
    setSaving(true);
    showToast("Saving scores...", "ok");
    const payload = players
      .filter((player) => typeof scores[player.id] === "number")
      .map((player) => ({
        round_id: roundId,
        player_id: player.id,
        hole_number: selectedHole,
        strokes: scores[player.id]
      }));

    if (payload.length === 0) {
      showToast("Enter at least one score to save.", "error");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("scores")
      .upsert(payload, { onConflict: "round_id,player_id,hole_number" });

    if (error) {
      showToast("Failed to save scores.", "error");
      setSaving(false);
      return;
    }

    showToast("Scores saved.", "ok");
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          Loading round...
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You are logged in but not listed as an admin for this event.
          </p>
          <Link
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-pine-600 px-4 py-2 text-sm font-semibold text-white"
            href="/admin"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
          {event?.name ?? "Myrtle Beach Classic 2026"}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {event?.name ?? "Myrtle Beach Classic 2026"} – Enter Scores
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {round?.round_number ? `Round ${round.round_number}` : "Round"} •{" "}
          {round?.course ?? round?.name ?? "Course"} • Course scores hole-by-hole.
        </p>
      </header>

      {toast && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            toast.tone === "ok"
              ? "bg-pine-50 text-pine-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {isPinRequired && !authorized && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Enter the round PIN to unlock score entry.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base focus:border-pine-500 focus:outline-none"
              placeholder="PIN"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
            <button
              className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60"
              onClick={handlePinSubmit}
              type="button"
            >
              Unlock Entry
            </button>
          </div>
        </section>
      )}

      {(!isPinRequired || authorized) && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Hole
              </p>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {holes.map((hole) => (
                  <button
                    key={hole}
                    type="button"
                    onClick={() => setSelectedHole(hole)}
                    className={`h-10 rounded-xl text-sm font-semibold transition ${
                      selectedHole === hole
                        ? "bg-pine-600 text-white"
                        : "bg-pine-50 text-pine-700"
                    }`}
                  >
                    {hole}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {player.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Handicap {player.handicap}
                    </p>
                  </div>
                  <input
                    className="h-12 w-20 rounded-2xl border border-slate-200 text-center text-lg font-semibold text-slate-900 focus:border-pine-500 focus:outline-none"
                    inputMode="numeric"
                    max={20}
                    min={1}
                    pattern="[0-9]*"
                    type="number"
                    value={scores[player.id] ?? ""}
                    onChange={(event) =>
                      handleScoreChange(player.id, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <button
              className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? "Saving..." : "Save Scores"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
