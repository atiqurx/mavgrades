"use client";

import dynamic from "next/dynamic";

// Disable SSR 
const AuthForm = dynamic(
  () => import("../components/AuthForm"),
  { ssr: false }
);

export default function Page() {
  return <AuthForm />;
}
