"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

interface Review {
  id: number;
  course_code: string;
  professor_name: string;
  is_online: boolean;
  rating_professor: number;
  difficulty: number;
  take_again: boolean;
  taken_for_credit: boolean;
  used_textbooks: boolean;
  attendance_mandatory: boolean;
  grade_received: string;
  tags: string[];
  review_text: string;
  created_at: string;
}

interface ReviewListProps {
  course: string | null;
  professor: string | null;
}

export default function ReviewList({ course, professor }: ReviewListProps) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useUser();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!course || !professor) return;

    setLoading(true);
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from<Review>("reviews")
          .select("*")
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
    <div className="bg-gray-100 bg-opacity-10 p-4 rounded-lg mt-8 text-white shadow-md">
      <h3 className="text-2xl text-center font-bold my-2">
        Student Reviews ({course} - {professor})
      </h3>
      <div className="border-b-2 rounded border-gray-500 w-1/2 mx-auto mb-4 px-10"></div>
      <div className="mt-8 space-y-8">
        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet for this course and professor.</p>
        ) : (
          <ul className="space-y-6">
            {reviews.map((review) => {
              // dynamic color based on rating
              const ratingColor =
                review.rating_professor > 3
                  ? "green-400"
                  : review.rating_professor === 3
                  ? "orange-400"
                  : "rose-400";

              return (
                <li
                  key={review.id}
                  className="bg-gray-100 bg-opacity-10 px-4 py-6 rounded-md"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[10%,85%] gap-x-6 gap-y-6">
                    {/* Quality & Difficulty */}
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs uppercase font-bold text-center text-gray-300 mb-1">
                          Quality
                        </div>
                        <div
                          className={`bg-gray-200 bg-opacity-10 text-${ratingColor} font-bold text-2xl p-3 rounded border-t-4 border-t-${ratingColor}`}
                        >
                          {review.rating_professor.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-center font-semibold text-gray-300 mb-1">
                          Difficulty
                        </div>
                        <div className="bg-gray-200 bg-opacity-10 text-teal-400 font-bold text-2xl p-3 rounded border-t-4 border-t-teal-400">
                          {review.difficulty.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Date, Details, Text, Tags */}
                    <div className="flex flex-col">
                      {/* Date */}
                      <div className="flex justify-end text-xs text-gray-300 mb-2">
                        {new Date(review.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>

                      {/* Info */}
                      <div className="text-md text-gray-200 flex flex-wrap gap-x-4 gap-y-1 mb-4">
                        <span>
                          For Credit:{" "}
                          <span className="font-bold">
                            {review.taken_for_credit ? "Yes" : "No"}
                          </span>
                        </span>
                        <span>
                          Attendance:{" "}
                          <span className="font-bold">
                            {review.attendance_mandatory
                              ? "Mandatory"
                              : "Optional"}
                          </span>
                        </span>
                        <span>
                          Would Take Again:{" "}
                          <span className="font-bold">
                            {review.take_again ? "Yes" : "No"}
                          </span>
                        </span>
                        <span>
                          Grade:{" "}
                          <span className="font-bold">
                            {review.grade_received}
                          </span>
                        </span>
                        <span>
                          Textbook:{" "}
                          <span className="font-bold">
                            {review.used_textbooks ? "Yes" : "N/A"}
                          </span>
                        </span>
                      </div>

                      {/* Review Text */}
                      <div className="mb-4 text-gray-100 leading-relaxed">
                        &quot;{review.review_text}&quot;
                      </div>

                      {/* Tags */}
                      {review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-gray-100 bg-opacity-20 text-sm px-2 py-1 rounded-md font-medium capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => {
            if (user) {
              router.push(
                `/add-review?course=${encodeURIComponent(
                  course
                )}&professor=${encodeURIComponent(professor)}`
              );
            } else {
              router.push("/auth");
            }
          }}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-400 text-white font-semibold"
        >
          Add Review
        </button>
      </div>
    </div>
  );
}
