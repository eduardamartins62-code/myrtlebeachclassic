"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        setError(error.message || "Failed to sign in");
        setLoading(false);
        return;
      }

      // Success: go to admin
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      setError("Unexpected error while signing in");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-white border rounded-lg p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-center">Admin Login</h1>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full py-2 rounded bg-black text-white text-sm font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
