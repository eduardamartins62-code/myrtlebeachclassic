type AdminLoginPageProps = {
  searchParams?: {
    error?: string;
    redirectTo?: string;
  };
};

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const errorMessage =
    searchParams?.error === "missing"
      ? "Admin password is not configured."
      : searchParams?.error === "invalid"
        ? "Incorrect password."
        : null;
  const redirectTo = searchParams?.redirectTo ?? "/admin";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
          Myrtle Beach Classic 2026
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Admin Login
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the admin password to continue.
        </p>
      </header>

      {errorMessage && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <form action="/api/admin/login" method="POST" className="grid gap-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Password
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              name="password"
              placeholder="Enter admin password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="h-12 w-full rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
