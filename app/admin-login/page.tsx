"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError(signInError.message || "Unable to sign in right now.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
          Myrtle Beach Classic 2026
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your admin or score keeper credentials to continue.
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Email
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(eventItem) => setEmail(eventItem.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            Password
            <input
              className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(eventItem) => setPassword(eventItem.target.value)}
            />
          </label>
          {error && (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          )}
          <button
            className="h-12 rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
