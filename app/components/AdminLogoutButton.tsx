"use client";

import { supabase } from "@/lib/supabaseClient";

type AdminLogoutButtonProps = {
  className?: string;
};

export default function AdminLogoutButton({
  className =
    "h-9 rounded-2xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
}: AdminLogoutButtonProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin-login";
  };

  return (
    <button className={className} onClick={handleLogout} type="button">
      Log out
    </button>
  );
}
