export default function AdminPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Admin home
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Welcome to the Myrtle Beach Classic admin
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Use the navigation to move between data areas. The dashboard is ready
          for wiring, but no business logic has been connected yet.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Events",
            description: "Configure tournament events and key dates."
          },
          {
            title: "Itinerary",
            description: "Manage schedules, travel, and hospitality blocks."
          },
          {
            title: "History",
            description: "Curate past winners, stats, and legacy content."
          },
          {
            title: "Users",
            description: "Assign roles, access, and invitations."
          },
          {
            title: "Assets",
            description: "Upload media and brand collateral."
          },
          {
            title: "Settings",
            description: "Control global admin preferences."
          }
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {card.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Coming soon
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
