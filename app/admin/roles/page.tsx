import RolesAdminClient from "./RolesAdminClient";
import { requireSuperAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type UserWithRole = {
  id: string;
  email: string;
  role: string;
};

export default async function RolesAdminPage() {
  await requireSuperAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const [{ data: usersData }, { data: profilesData }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.from("profiles").select("id,role")
  ]);

  const profiles = (profilesData ?? []) as ProfileRow[];
  const roleByUser = new Map(profiles.map((profile) => [profile.id, profile]));

  const users: UserWithRole[] = (usersData?.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "",
    role: roleByUser.get(user.id)?.role ?? "PLAYER"
  }));

  return <RolesAdminClient initialUsers={users} />;
}
