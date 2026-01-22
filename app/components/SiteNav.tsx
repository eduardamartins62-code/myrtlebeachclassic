"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/itinerary", label: "Itinerary" },
  { href: "/history", label: "History" }
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-white/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link className="text-sm font-semibold text-slate-900" href="/">
          Myrtle Beach Classic
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                  isActive
                    ? "bg-pine-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
