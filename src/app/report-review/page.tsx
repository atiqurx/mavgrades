"use client";

import dynamic from "next/dynamic";

// Disable SSR 
const ReportReview = dynamic(
  () => import("../components/ReportReview"),
  { ssr: false }
);

export default function Page() {
  return <ReportReview />;
}