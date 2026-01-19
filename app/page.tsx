"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type RoundRow = {
  id: string;
  name: string | null;
  round_number: number | null;
  course: string | null;
  date: string | null;
};

export default function HomePage() {
  const [rounds, setRounds] = useState<RoundRow[]>([]);

  useEffect(() => {
    const loadRounds = async () => {
      const { data, error } = await supabase
        .from("rounds")
        .select("id,name,round_number,course,date")
        .order("round_number", { ascending: true });
      if (error) return;
      setRounds(data ?? []);
    };
    void loadRounds();
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10">
      <header className="rounded-3xl bg-white/80 p-6 shadow-lg shadow-pine-100/70">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine-600">
          Myrtle Beach Classic 2026
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Live Leaderboard &amp; Scoring
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Select a round to view the broadcast-style leaderboard or enter
          scores.
        </p>
      </header>

      <section className="grid gap-4">
        <Link
          className="rounded-2xl border border-pine-100 bg-white px-5 py-4 text-base font-semibold text-pine-700 shadow-sm transition hover:border-pine-200"
          href="/admin"
        >
          Go to Admin
        </Link>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Trip Rounds
        </h2>
        {rounds.length === 0 && (
          <div className="rounded-2xl border border-dashed border-pine-200 bg-white/70 px-5 py-4 text-sm text-slate-600">
            No rounds yet. Create Round 1-5 in the admin panel.
          </div>
        )}
        {rounds.map((round) => (
          <Link
            key={round.id}
            className="flex flex-col gap-1 rounded-2xl border border-pine-100 bg-white px-5 py-4 text-sm shadow-sm transition hover:border-pine-200"
            href={`/r/${round.id}`}
          >
            <span className="text-base font-semibold text-slate-900">
              Round {round.round_number ?? 1}
            </span>
            <span className="text-xs text-slate-500">
              {round.name ?? "Myrtle Beach Classic 2026"}
            </span>
            {(round.course || round.date) && (
              <span className="text-xs text-slate-500">
                {[round.course, round.date].filter(Boolean).join(" • ")}
              </span>
            )}
          </Link>
        ))}
      </section>
    </main>
  );
}
