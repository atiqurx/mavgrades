"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useState, ReactNode } from "react";

export default function ClientSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={undefined}
    >
      {children}
    </SessionContextProvider>
  );
}
