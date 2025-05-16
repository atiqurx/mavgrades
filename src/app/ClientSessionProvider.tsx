"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useState, ReactNode } from "react";

export default function ClientSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={undefined}
    >
      {children}
    </SessionContextProvider>
  );
}
