"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

interface Review {
  id: number;
  review_text: string;
  created_at: string;
  reviewer_nickname: string | null;
}

interface ReviewListProps {
  course: string | null;
  professor: string | null;
}

export default function ReviewList({ course, professor }: ReviewListProps) {
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!course || !professor) return;

    setLoading(true);
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, review_text, created_at, reviewer_nickname")
          .eq("course_code", course)
          .eq("professor_name", professor)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching reviews:", error);
          setReviews([]);
        } else {
          setReviews(data ?? []);
        }
      } catch (err) {
        console.error("Unexpected error fetching reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [course, professor, supabase]);

  if (!course || !professor) return null;

  return (
    <div className="bg-gray-200 bg-opacity-10 p-4 rounded-lg mt-8 text-white shadow-md">
      <h3 className="font-bold text-lg mb-2">Student Reviews</h3>
      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet for this course and professor.</p>
      ) : (
        <ul className="max-h-60 overflow-y-auto space-y-2">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-gray-400 pb-2">
              <p>"{review.review_text}"</p>
              <p className="text-sm text-gray-300 italic">
                — {review.reviewer_nickname ?? "Anonymous"},{" "}
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() =>
          router.push(
            `/add-review?course=${encodeURIComponent(
              course
            )}&professor=${encodeURIComponent(professor)}`
          )
        }
        className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white font-semibold"
      >
        Add Review
      </button>
    </div>
  );
}
