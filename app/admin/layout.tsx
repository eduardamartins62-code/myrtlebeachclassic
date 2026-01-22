import type { ReactNode } from "react";
import { requireSuperAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold">
            Myrtle Beach Classic – Admin
          </h1>
          <nav className="flex gap-4 text-sm">
            <a href="/admin">Dashboard</a>
            <a href="/admin/events">Events</a>
            <a href="/admin/itinerary">Itinerary</a>
            <a href="/admin/history">History</a>
            <a href="/admin/users">Users</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
