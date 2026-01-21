"use client";

import { useState } from "react";
import Link from "next/link";
import { EVENT_NAME } from "@/lib/event";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setError("Incorrect password. Please try again.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-lg shadow-pine-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
          {EVENT_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Admin Login
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the admin password to manage the leaderboard.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Password
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <Link
          className="mt-6 inline-flex text-sm font-semibold text-slate-500 hover:text-slate-700"
          href="/"
        >
          Back to leaderboard
        </Link>
      </div>
    </main>
  );
}
