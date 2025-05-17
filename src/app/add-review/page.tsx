"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

const TAG_OPTIONS = [
  "Tough Grader",
  "Get Ready To Read",
  "Participation Matters",
  "Extra Credit",
  "Group Projects",
  "Amazing Lectures",
  "Clear Grading Criteria",
  "Gives Good Feedback",
  "Inspirational",
  "Lots Of Homework",
  "Hilarious",
  "Beware Of Pop Quizzes",
  "So Many Papers",
  "Caring",
  "Respected",
  "Lecture Heavy",
  "Test Heavy",
  "Graded By Few Things",
  "Accessible Outside Class",
  "Online Savvy",
];

export default function AddReview() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const course = searchParams.get("course") ?? "";
  const professor = searchParams.get("professor") ?? "";

  // Form state
  const [formData, setFormData] = useState({
    courseCode: course,
    professor,
    onlineCourse: false,
    qualityRating: 0,
    difficultyRating: 0,
    takeAgain: "",
    credit: "",
    textbooksUsed: "",
    attendanceMandatory: "",
    gradeReceived: "",
    tags: [] as string[],
    reviewText: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setFormData((prev) => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : prev.tags.length < 3
        ? [...prev.tags, tag]
        : prev.tags;
      return { ...prev, tags };
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in to submit a review.");
      return;
    }

    if (
      !formData.courseCode ||
      !formData.professor ||
      formData.qualityRating === 0 ||
      formData.difficultyRating === 0 ||
      formData.takeAgain === "" ||
      formData.credit === "" ||
      formData.textbooksUsed === "" ||
      formData.attendanceMandatory === "" ||
      !formData.gradeReceived ||
      !formData.reviewText.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        course_code: formData.courseCode,
        professor_name: formData.professor,
        is_online: formData.onlineCourse,
        rating_professor: formData.qualityRating,
        difficulty: formData.difficultyRating,
        take_again: formData.takeAgain === "yes",
        taken_for_credit: formData.credit === "yes",
        used_textbooks: formData.textbooksUsed === "yes",
        attendance_mandatory: formData.attendanceMandatory === "yes",
        grade_received: formData.gradeReceived,
        tags: formData.tags,
        review_text: formData.reviewText,
        user_id: user.id,
        reviewer_nickname: user.user_metadata?.nickname || null,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(
          `/results?course=${encodeURIComponent(
            course
          )}&professor=${encodeURIComponent(professor)}`
        );
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-400 bg-opacity-10 rounded-xl text-white p-8 max-w-3xl mx-auto my-20 shadow-md">
      <h1 className="text-3xl font-bold mb-6 mt-4">
        Add Review for {course} - {professor}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Code */}
        <div>
          <label className="text-lg block font-semibold mb-2" htmlFor="courseCode">
            Select Course Code *
          </label>
          <input
            type="text"
            id="courseCode"
            name="courseCode"
            value={formData.courseCode}
            readOnly
            className="w-full p-2 rounded bg-gray-100 bg-opacity-10 border border-white-200 focus:outline-none focus:ring-0"
          />
          <label className="inline-flex items-center mt-4 cursor-pointer text-lg">
            <input
              type="checkbox"
              name="onlineCourse"
              checked={formData.onlineCourse}
              onChange={handleChange}
              className="mr-2"
            />
            <span>This is an online course</span>
          </label>
        </div>

        {/* Quality Rating */}
        <div>
          <label className="block font-semibold mb-2 text-lg">
            Rate your professor *
          </label>
          <RatingBar
            value={formData.qualityRating}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, qualityRating: val }))
            }
            minLabel="(Awful) 1"
            maxLabel="5 (Awesome)"
          />
        </div>

        {/* Difficulty Rating */}
        <div>
          <label className="block font-semibold mb-2 text-lg">
            How difficult was this professor? *
          </label>
          <RatingBar
            value={formData.difficultyRating}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, difficultyRating: val }))
            }
            minLabel="(Very Easy) 1"
            maxLabel="5 (Very Difficult)"
          />
        </div>

        {/* Would you take again? */}
        <RadioGroup
          label="Would you take this professor again? *"
          name="takeAgain"
          value={formData.takeAgain}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onChange={handleChange}
        />

        {/* Credit taken */}
        <RadioGroup
          label="Was this class taken for credit? *"
          name="credit"
          value={formData.credit}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onChange={handleChange}
        />

        {/* Textbooks used */}
        <RadioGroup
          label="Did this professor use textbooks? *"
          name="textbooksUsed"
          value={formData.textbooksUsed}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onChange={handleChange}
        />

        {/* Attendance mandatory */}
        <RadioGroup
          label="Was attendance mandatory? *"
          name="attendanceMandatory"
          value={formData.attendanceMandatory}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onChange={handleChange}
        />

        {/* Grade received */}
        <div>
          <label className="block font-semibold mb-2 text-lg" htmlFor="gradeReceived">
            Select grade received *
          </label>
          <select
            id="gradeReceived"
            name="gradeReceived"
            value={formData.gradeReceived}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-200 bg-opacity-10 focus:outline-none focus:ring-0"
            required
          >
            <option value="">Select grade</option>
            {["A", "B", "C", "D", "F", "P", "W", "Q", "N/A"].map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block font-semibold mb-2  text-lg">
            Select up to 3 tags
          </label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  formData.tags.includes(tag)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 bg-opacity-20 text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block font-semibold mb-2 text-lg" htmlFor="reviewText">
            Write a Review *
          </label>
          <textarea
            id="reviewText"
            name="reviewText"
            rows={6}
            maxLength={350}
            value={formData.reviewText}
            onChange={handleChange}
            placeholder="Discuss the professor's professional abilities including teaching style and ability to convey the material clearly"
            className="w-full p-3 rounded bg-gray-800 border border-gray-200 bg-opacity-10 resize-none focus:outline-none focus:ring-0"
            required
          />
          <p className="text-sm text-gray-400 mt-1 text-right">
            {formData.reviewText.length}/350
          </p>
        </div>

        {/* Error and submit */}
        {error && <p className="text-red-500 font-semibold">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

// RatingBar component for 1-5 rating stars
function RatingBar({
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  value: number;
  onChange: (val: number) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div className="flex items-center gap-4 select-none">
      <span>{minLabel}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            onClick={() => onChange(star)}
            className={`w-6 h-6 mr-2 cursor-pointer rounded-full ${
              value >= star ? "bg-blue-400" : "bg-gray-200 bg-opacity-30"
            }`}
          />
        ))}
      </div>
      <span>{maxLabel}</span>
    </div>
  );
}

// RadioGroup component for yes/no radios
function RadioGroup({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <fieldset>
      <legend className="block font-semibold mb-2 text-lg">{label}</legend>
      <div className="flex gap-6">
        {options.map(({ label, value: val }) => (
          <label
            key={val}
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={val}
              checked={value === val}
              onChange={onChange}
              required
              className="cursor-pointer"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
