export default function AdminPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Rebuild in progress
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Admin is being rebuilt from scratch.
        </h2>
        <p className="mt-3 text-base text-slate-600">
          This area is intentionally minimal while we lay down new structure,
          workflows, and permissions. Check back soon for the refreshed admin
          experience.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            What is here now
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• Fresh layout shell</li>
            <li>• Placeholder dashboard copy</li>
            <li>• No legacy admin logic</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            What comes next
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• New navigation + data views</li>
            <li>• Lightweight permission guard</li>
            <li>• Updated content tools</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
