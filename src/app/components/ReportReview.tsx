"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export default function ReportReviewPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const reviewId = params.get("reviewId"); 

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Debug: log the raw reviewId
  // useEffect(() => {
  //   console.log("[ReportReviewPage] reviewId param =", reviewId);
  // }, [reviewId]);

  if (!reviewId) {
    return <p className="p-4 text-red-400">Invalid review ID.</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in to report.");
      return;
    }
    if (!text.trim()) {
      setError("Please describe why you’re reporting this review.");
      return;
    }

    setSaving(true);

    // Fetch the review’s author (reported_user_id) and current count
    const { data: reviewMeta, error: metaErr } = await supabase
      .from("reviews")
      .select("user_id, report_count")
      .eq("id", reviewId)
      .single();

    if (metaErr || !reviewMeta) {
      console.error("[Report] Error fetching review meta:", metaErr);
      setError("Could not fetch review details. Please try again.");
      setSaving(false);
      return;
    }

    const reportedUserId = reviewMeta.user_id;
    const nextCount = (reviewMeta.report_count ?? 0) + 1;

    // Insert the report
    const { error: insertErr } = await supabase.from("review_reports").insert({
      review_id: reviewId,
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      report_text: text.trim(),
    });

    if (insertErr) {
      console.error("[Report] Insert error:", insertErr);
      setError(insertErr.message);
      setSaving(false);
      return;
    }

    // Increment the denormalized counter on reviews
    const { error: updateErr } = await supabase
      .from("reviews")
      .update({ report_count: nextCount })
      .eq("id", reviewId);

    if (updateErr) {
      console.error("[Report] Update count error:", updateErr);
    }

    // Redirect back
    router.back();
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-gray-800 rounded-lg text-white mt-12">
      <h1 className="text-2xl font-bold mb-4">Report Review</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block font-medium">
          Why are you reporting this review?
        </label>
        <textarea
          className="w-full p-3 bg-gray-700 rounded resize-none"
          rows={6}
          placeholder="Describe the issue…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error && <p className="text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
        >
          {saving ? "Reporting…" : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
