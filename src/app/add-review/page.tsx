"use client";

import dynamic from "next/dynamic";

// Disable SSR 
const AddReview = dynamic(
  () => import("../components/AddReview"),
  { ssr: false }
);

export default function Page() {
  return <AddReview />;
}