import type { ReactNode } from "react";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin
          </p>
          <h1 className="text-2xl font-semibold">Myrtle Beach Classic</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
