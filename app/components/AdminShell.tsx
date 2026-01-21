"use client";

import Link from "next/link";
import { type ReactNode } from "react";

type AdminShellProps = {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  backLinkLabel?: string;
  backLinkHref?: string;
  children: ReactNode;
};

export default function AdminShell({
  title,
  subtitle,
  description,
  actions,
  backLinkLabel = "Back to site",
  backLinkHref = "/",
  children
}: AdminShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {subtitle && (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
                {subtitle}
              </p>
            )}
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {description && (
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
              href={backLinkHref}
            >
              {backLinkLabel}
            </Link>
            {actions}
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
