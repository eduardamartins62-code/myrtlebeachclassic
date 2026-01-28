import type { ReactNode } from "react";
import Link from "next/link";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/itinerary", label: "Itinerary" },
  { href: "/admin/history", label: "History" },
  { href: "/admin/users", label: "Users" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold">Myrtle Beach Classic</h1>
            <p className="text-sm text-slate-500">
              Secure access • Draft workspace
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <aside className="w-full max-w-xs shrink-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Navigation
          </p>
          <nav className="mt-4 flex flex-col gap-2 text-sm font-semibold text-slate-700">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                className="rounded-2xl border border-transparent px-4 py-2 transition hover:border-slate-200 hover:bg-slate-50"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
