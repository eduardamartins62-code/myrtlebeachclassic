"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AdminStatus = {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  error: string | null;
};

export const useAdminStatus = (eventId?: string | null) => {
  const [status, setStatus] = useState<AdminStatus>({
    loading: true,
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      setStatus((prev) => ({ ...prev, loading: true, error: null }));
      const { data, error: authError } = await supabase.auth.getUser();

      if (!isMounted) return;

      const user = data.user ?? null;
      if (authError || !user) {
        setStatus({
          loading: false,
          user: null,
          isAdmin: false,
          isAuthenticated: false,
          error: authError?.message ?? null
        });
        return;
      }

      if (!eventId) {
        setStatus({
          loading: false,
          user,
          isAdmin: false,
          isAuthenticated: true,
          error: null
        });
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("event_admins")
        .select("user_id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      setStatus({
        loading: false,
        user,
        isAdmin: Boolean(adminRow),
        isAuthenticated: true,
        error: adminError?.message ?? null
      });
    };

    void loadStatus();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void loadStatus();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [eventId]);

  return status;
};
