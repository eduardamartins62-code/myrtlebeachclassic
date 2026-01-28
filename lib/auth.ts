import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type UserRole = "SUPER_ADMIN" | "SCORE_KEEPER" | "PLAYER" | "GUEST";

const normalizeRole = (role: string | null | undefined): UserRole => {
  if (role === "SUPER_ADMIN" || role === "SCORE_KEEPER" || role === "PLAYER") {
    return role;
  }
  return "GUEST";
};

export async function getCurrentUserWithRole() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: "GUEST" as UserRole };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    role: normalizeRole(profile?.role ?? "PLAYER")
  };
}

export async function requireSuperAdmin() {
  const { user, role } = await getCurrentUserWithRole();

  // Temporary bypass for admin rebuild. Reintroduce guard once new admin flows
  // are ready.
  return { user, role };
}

export async function requireScoreEntryAccess() {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    redirect("/admin-login");
  }

  if (role !== "SUPER_ADMIN" && role !== "SCORE_KEEPER") {
    redirect("/");
  }

  return { user, role };
}
