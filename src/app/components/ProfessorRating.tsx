import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface ProfessorRatingProps {
  professorName: string;
}

interface RMPData {
  rmp_name: string;
  url: string;
  department: string;
  quality_rating: string;
  difficulty_rating: string;
  total_ratings: string;
  would_take_again: string;
  tags: string;
}

const ProfessorRating: React.FC<ProfessorRatingProps> = ({ professorName }) => {
  const [ratingData, setRatingData] = useState<RMPData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfessorRating = async () => {
      try {
        const response = await fetch(
          `/api/professor-rating?name=${encodeURIComponent(professorName)}`
        );
        const data = await response.json();
        setRatingData(data);
      } catch (error) {
        console.error("Error fetching professor rating:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessorRating();
  }, [professorName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-3" />
        <span className="text-lg text-white">Loading professor rating…</span>
      </div>
    );
  }

  if (!ratingData) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
        <span className="text-white">
          No RateMyProfessor data found for this instructor.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 bg-opacity-10 p-6 rounded-lg text-white relative">
      <h3 className="text-2xl text-center font-bold mb-2">
        Professor Ratings{" "}
        <span>
          (
          <a
            href={ratingData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            RMP
          </a>
          )
        </span>
      </h3>
      <div className="border-b-2 rounded border-gray-500 w-1/2 mx-auto mb-4 px-10"></div>

      {/* Last updated button */}
      <button
        className="absolute top-4 right-4 text-xs text-gray-300 p-2 rounded-full flex items-center gap-2"
        title="Last updated"
      >
        <span>Last updated May 8, 2025</span>
      </button>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col bg-gray-200 bg-opacity-10 p-3 gap-2 rounded-lg font-bold drop-shadow-lg border-t-4 border-t-blue-400">
          <h4 className="text-white text-xs sm:text-base uppercase font-semibold">
            Quality Rating
          </h4>
          <p className="text-2xl text-blue-400">{ratingData.quality_rating}</p>
        </div>
        <div className="flex flex-col bg-gray-200 bg-opacity-10 p-3 gap-2 rounded-lg font-bold drop-shadow-lg border-t-4 border-t-green-400">
          <h4 className="text-white text-xs sm:text-base uppercase font-semibold">
            Difficulty Rating
          </h4>
          <p className="text-2xl text-green-400">
            {ratingData.difficulty_rating}
          </p>
        </div>
        <div className="flex flex-col bg-gray-200 bg-opacity-10 p-3 gap-2 rounded-lg font-bold drop-shadow-lg border-t-4 border-t-orange-400">
          <h4 className="text-white text-xs sm:text-base uppercase font-semibold">
            Would Take Again
          </h4>
          <p className="text-2xl text-orange-400">
            {ratingData.would_take_again}
          </p>
        </div>
        <div className="flex flex-col bg-gray-200 bg-opacity-10 p-3 gap-2 rounded-lg font-bold drop-shadow-lg border-t-4 border-t-teal-400">
          <h4 className="text-white text-xs sm:text-base uppercase font-semibold">
            Total Ratings
          </h4>
          <p className="text-2xl text-teal-400">{ratingData.total_ratings}</p>
        </div>
      </div>
      <div className="flex flex-col">
        <h4 className="text-xl uppercase font-semibold mb-2">Tags:</h4>
        <div className="flex gap-2 flex-wrap">
          {ratingData.tags.split(", ").map((tag, index) => (
            <span
              key={index}
              className="bg-gray-200 bg-opacity-20 text-md px-2 py-1 rounded-md font-medium capitalize"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessorRating;
