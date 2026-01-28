export default function AdminUsersPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Users
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          User access
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Manage admin access, roles, and invitations. User provisioning will
          be connected once authentication rules are finalized.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            User directory
          </p>
          <p className="mt-3 text-base text-slate-600">
            No admin users have been listed yet.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Invite a user
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Email and role assignment</li>
            <li>• Status tracking</li>
            <li>• Welcome messaging</li>
          </ul>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Form coming soon
          </p>
        </div>
      </div>
    </section>
  );
}
