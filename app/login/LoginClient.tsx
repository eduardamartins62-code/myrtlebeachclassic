"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim()) {
      setMessage("Enter an email address.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
          redirectTo
        )}`
      }
    });

    if (error) {
      setMessage("Unable to send magic link.");
      setLoading(false);
      return;
    }

    setMessage("Magic link sent. Check your inbox to continue.");
    setLoading(false);
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <header className="rounded-3xl bg-white p-6 shadow-lg shadow-pine-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pine-600">
          Myrtle Beach Classic 2026
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Admin Sign In
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email to receive a magic link.
        </p>
      </header>

      {message && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {message}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
          Email
          <input
            className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 focus:border-pine-500 focus:outline-none"
            placeholder="you@email.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button
          className="mt-4 h-12 w-full rounded-2xl bg-pine-600 text-base font-semibold text-white shadow-lg shadow-pine-200/60 disabled:opacity-60"
          disabled={loading}
          onClick={handleLogin}
          type="button"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </section>
    </main>
  );
}
