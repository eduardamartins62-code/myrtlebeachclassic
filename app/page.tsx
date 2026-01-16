import Link from "next/link";

export default function HomePage() {
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
          Use the admin panel to create a round, then share the leaderboard or
          enter scores for players.
        </p>
      </header>

      <section className="grid gap-4">
        <Link
          className="rounded-2xl border border-pine-100 bg-white px-5 py-4 text-base font-semibold text-pine-700 shadow-sm transition hover:border-pine-200"
          href="/admin"
        >
          Go to Admin
        </Link>
        <div className="rounded-2xl border border-dashed border-pine-200 bg-white/70 px-5 py-4 text-sm text-slate-600">
          Leaderboard links look like <code>/r/&lt;roundId&gt;</code> and score
          entry is <code>/r/&lt;roundId&gt;/enter</code>.
        </div>
      </section>
    </main>
  );
}
