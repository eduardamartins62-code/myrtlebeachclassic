"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/app/components/AdminShell";
import { EVENT_NAME } from "@/lib/event";
import { supabase } from "@/lib/supabaseClient";
import { useAdminStatus } from "@/lib/useAdminStatus";

const holes = Array.from({ length: 18 }, (_, index) => index + 1);

const showToastTimeout = 3000;

type RoundRow = {
  id: string;
  round_number: number | null;
  entry_pin: string | null;
  event_id: string;
  course: string | null;
  date: string | null;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "ok" | "error";
  } | null>(null);
  const { isAdmin, isAuthenticated, loading: authLoading } = useAdminStatus(
    round?.event_id
  );

  const showToast = useCallback((message: string, tone: "ok" | "error") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), showToastTimeout);
  }, []);

  const loadRound = useCallback(async () => {
    setLoading(true);
    const roundRes = await supabase
      .from("rounds")
      .select("id,round_number,entry_pin,event_id,course,date")
      .eq("id", roundId)
      .maybeSingle();

    if (roundRes.error || !roundRes.data) {
      showToast("Unable to load round.", "error");
      setLoading(false);
      return;
    }

    const [eventRes, playersRes] = await Promise.all([
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

  const handleClearScore = async (playerId: string, hole: number) => {
    if (!round) return;

    const { error } = await supabase
      .from("scores")
      .delete()
      .eq("round_id", roundId)
      .eq("player_id", playerId)
      .eq("hole_number", hole);

    if (error) {
      showToast("Failed to remove score.", "error");
      return;
    }

    setScores((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
    showToast("Score removed.", "ok");
  };

  const handleClearPlayerRound = async (
    playerId: string,
    playerName: string
  ) => {
    if (!round) return;
    if (!isAdmin) {
      showToast("Admin access required to remove scores.", "error");
      return;
    }
    const confirmed = window.confirm(
      `Clear all scores for ${playerName} in this round?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("scores")
      .delete()
      .eq("round_id", roundId)
      .eq("player_id", playerId);

    if (error) {
      showToast("Failed to clear scores.", "error");
      return;
    }

    setScores((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
    showToast("Scores cleared for player.", "ok");
  };

  if (loading || authLoading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          Loading round...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminShell
        title="Admin sign-in required"
        subtitle={EVENT_NAME}
        description="You must be logged in to enter scores."
      >
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-pine-600 px-4 text-sm font-semibold text-white"
            href="/login"
          >
            Go to Login
          </Link>
        </section>
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell
        title="Admin access required"
        subtitle={event?.name ?? EVENT_NAME}
        description="You are logged in but not listed as an admin for this event."
      >
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-pine-600 px-4 text-sm font-semibold text-white"
            href="/admin"
          >
            Go to Admin Dashboard
          </Link>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Enter Scores"
      subtitle={event?.name ?? EVENT_NAME}
      description={`${round?.round_number ? `Round ${round.round_number}` : "Round"} • ${
        round?.course ?? "Course"
      } • ${round?.date ? new Date(round.date).toLocaleDateString() : "Date TBA"}`}
      actions={
        <Link
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          href="/admin"
        >
          Back to Admin
        </Link>
      }
    >

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
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {player.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Handicap {player.handicap}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <button
                      className="h-10 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                      onClick={() =>
                        handleClearScore(player.id, selectedHole)
                      }
                      type="button"
                    >
                      Clear
                    </button>
                    <button
                      className="h-10 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                      onClick={() =>
                        handleClearPlayerRound(player.id, player.name)
                      }
                      type="button"
                    >
                      Clear round
                    </button>
                  </div>
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
    </AdminShell>
  );
}
