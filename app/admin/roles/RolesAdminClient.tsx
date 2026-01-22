"use client";

import { useState } from "react";
import AdminShell from "@/app/components/AdminShell";
import AdminLogoutButton from "@/app/components/AdminLogoutButton";

const roleOptions = ["SUPER_ADMIN", "SCORE_KEEPER", "PLAYER"] as const;

type RoleOption = (typeof roleOptions)[number];

type UserWithRole = {
  id: string;
  email: string;
  role: string;
};

type RolesAdminClientProps = {
  initialUsers: UserWithRole[];
};

export default function RolesAdminClient({
  initialUsers
}: RolesAdminClientProps) {
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const updateUserRole = (id: string, role: string) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, role } : user))
    );
  };

  const handleSave = async (user: UserWithRole) => {
    setLoading(true);
    const response = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: user.role })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      showToast(payload.error ?? "Unable to update role.");
      setLoading(false);
      return;
    }

    showToast("Role updated.");
    setLoading(false);
  };

  return (
    <AdminShell
      title="User Roles"
      subtitle="Admin Portal"
      description="Assign SUPER_ADMIN and SCORE_KEEPER permissions."
      backLinkLabel="Back to admin"
      backLinkHref="/admin"
      actions={<AdminLogoutButton />}
    >
      {toast && (
        <div className="rounded-2xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-700">
          {toast}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="py-3 pr-3">User</th>
                <th className="py-3 pr-3">Role</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-3 pr-3 font-semibold text-slate-900">
                    {user.email || user.id}
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      className="h-9 rounded-2xl border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                      value={user.role}
                      onChange={(event) =>
                        updateUserRole(user.id, event.target.value)
                      }
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <button
                      className="h-9 rounded-2xl bg-pine-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
                      disabled={loading || !roleOptions.includes(user.role as RoleOption)}
                      onClick={() => handleSave(user)}
                      type="button"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No users found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
