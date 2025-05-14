// src/components/UpsertProfile.tsx
"use client";

import { useEffect } from "react";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";

export default function UpsertProfile() {
  const user = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        email: user.email,
        nickname: user.email?.split("@")[0] ?? "",
        first_name: "",
        last_name: "",
      })
      .then(({ error }) => {
        if (error) console.error("Profile upsert error:", error);
      });
  }, [user, supabase]);

  return null;
}
