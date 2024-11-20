"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "../components/SearchBar";
import SideBar, { Course } from "../components/SideBar";
import { IoHomeOutline } from "react-icons/io5";
import { BsQuestionCircle } from "react-icons/bs";
import { Poppins, Montserrat } from "next/font/google";
import StatsCard from "../components/StatsCard";
// import Image from "next/image";

const poppins = Poppins({
   subsets: ["latin"],
   weight: ["400", "700"],
   variable: "--font-poppins",
});
const montserrat = Montserrat({
   subsets: ["latin"],
   weight: ["400", "700"],
   variable: "--font-montserrat",
});

const ResultsContent = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const course = searchParams.get("course");
   const professor = searchParams.get("professor");
   const [courses, setCourses] = useState<Course[]>([]);
   const [coursesToDisplay, setCoursesToDisplay] = useState<Course[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedProfessor, setSelectedProfessor] = useState<
      string | undefined
   >(undefined);
   const [selectedYear, setSelectedYear] = useState<string | null>(null);
   const [selectedCourse, setSelectedCourse] = useState<string | undefined>(
      undefined
   );
   const [selectedSemester, setSelectedSemester] = useState<string | null>(
      null
   );
   const [selectedSection, setSelectedSection] = useState<Course | null>(null);
   const [routeType, setRouteType] = useState<"course" | "professor" | null>(
      null
   );
   const [selectedItems, setSelectedItems] = useState<Map<string, any>>(
      new Map()
   );

   const fetchCourses = async () => {
      setLoading(true);
      setSelectedItems(new Map());
      try {
         if (course) {
            const response = await fetch(
               `/api/courses/search?course=${encodeURIComponent(course)}`
            );
            const data = await response.json();
            setRouteType("course");
            setSelectedCourse(course);
            setCourses(data);
         } else if (professor) {
            const response = await fetch(
               `/api/courses/search?professor=${encodeURIComponent(professor)}`
            );
            const data = await response.json();
            setSelectedProfessor(professor);
            const filteredCourses = data.filter((course: Course) => {
               const matchesProfessor = selectedProfessor
                  ? course.instructor1 === selectedProfessor
                  : true;
               const matchesCourse = selectedCourse
                  ? course.subject_id === selectedCourse
                  : true;
               return matchesProfessor && matchesCourse;
            });

            const uniqueFilteredCourses = filteredCourses.reduce(
               (acc: Course[], course: Course) => {
                  const identifier = `${course.subject_id}-${course.course_number}`;
                  if (
                     !acc.some(
                        (c: Course) =>
                           `${c.subject_id}-${c.course_number}` === identifier
                     )
                  ) {
                     acc.push(course);
                  }
                  return acc;
               },
               []
            );

            setRouteType("professor");
            setCourses(filteredCourses);
            setCoursesToDisplay(uniqueFilteredCourses);
         }
      } catch (error) {
         console.error("Error fetching courses:", error);
      } finally {
         setLoading(false);
      }
   };
   console
      .log(
        selectedProfessor,
        selectedCourse,
        selectedYear,
        selectedSemester,
        selectedSection,
        selectedItems
      );
   useEffect(() => {
      if (course || professor) {
         fetchCourses();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [course, professor]);

   const [subjectId, courseNumber] = selectedCourse
      ? selectedCourse.split(" ")
      : [null, null];
   const professors = [...new Set(courses.map((course) => course.instructor1))];
   const filteredCourses = selectedProfessor
      ? courses.filter((course) => course.instructor1 === selectedProfessor)
      : [];
   const years = [
      ...new Set(
         filteredCourses
            .filter(
               (course) =>
                  !selectedCourse || // Allow all courses if no course is selected yet
                  (course.subject_id === subjectId &&
                     course.course_number === courseNumber)
            )
            .map((course) => course.year)
            .sort((a: any, b: any) => b - a) // Sort years in descending order
      ),
   ];
   const semesters = [
      ...new Set(
         filteredCourses
            .filter(
               (course) =>
                  !selectedCourse || // Allow all courses if no course is selected yet
                  (course.subject_id === subjectId &&
                     course.course_number === courseNumber &&
                     course.year === selectedYear)
            )
            .map((course) => course.semester)
      ),
   ];

   const finalFilteredCourses = filteredCourses
      .filter((course) => {
         const matchesYear = selectedYear ? course.year === selectedYear : true;
         const matchesSemester = selectedSemester
            ? course.semester === selectedSemester
            : true;
         return matchesYear && matchesSemester;
      })
      .sort((a, b) => {
         // Sort by section_number in ascending order
         return a.section_number.localeCompare(b.section_number);
      });

   const handleProfessorClick = (professor: any) => {
      setSelectedProfessor(professor);
      setSelectedYear(null);
      setSelectedSemester(null);
      setSelectedSection(null);
   };

   const handleCourseClick = (course: string | undefined) => {
      setSelectedCourse(course);
      setSelectedYear(null);
      setSelectedSemester(null);
      setSelectedSection(null);
   };

   const resetState = () => {
      setSelectedProfessor(undefined);
      setSelectedCourse(undefined);
      setSelectedYear(null);
      setSelectedSemester(null);
      setSelectedSection(null);
      setCourses([]);
      setCoursesToDisplay([]);
   };

   return (
      <div className="min-h-screen w-full">
         <div className="max-w-7xl mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
               <IoHomeOutline
                  onClick={() => router.push('/')}
                  className="text-2xl cursor-pointer ml-4 mt-1 text-gray-300"
                  aria-label="Home"
               />
               <div 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => router.push('/')}
               >
                  <h1 className="text-2xl font-montserrat">
                     <span
                        className={`${poppins.className} font-bold text-gray-300`}
                     >
                        MAV
                     </span>
                     <span
                        className={`${montserrat.className} font-normal text-gray-300`}
                     >
                        GRADES
                     </span>
                  </h1>
               </div>
               <BsQuestionCircle
                  className="text-2xl cursor-pointer mr-4 mt-1 text-gray-300"
                  onClick={() => router.push('/faq')}
                  aria-label="faq"
               />
            </div>
            {/* SearchBar always at the top */}
            <div className="text-white m-4">
               <SearchBar
                  initialValue={course || ""}
                  resetState={resetState}
                  course={selectedCourse}
                  professor={selectedProfessor}
                  routeType={routeType}
               />
            </div>

            {loading ? (
               <p className="text-white">Loading...</p>
            ) : courses.length === 0 ? (
               <p className="text-white">
                  No results found for &quot;{course || professor}&quot;. Please
                  try another search.
               </p>
            ) : (
              <div className="flex flex-col lg:flex-row ml-4 mr-4">
                  {/* Sidebar */}
                  <SideBar
                     professors={professors}
                     selectedProfessor={selectedProfessor}
                     setSelectedProfessor={handleProfessorClick}
                     years={years}
                     selectedYear={selectedYear}
                     selectedCourse={selectedCourse}
                     coursesToDisplay={coursesToDisplay}
                     setCoursesToDisplay={setCoursesToDisplay}
                     setSelectedCourse={handleCourseClick}
                     setSelectedYear={setSelectedYear}
                     semesters={semesters}
                     selectedSemester={selectedSemester}
                     setSelectedSemester={setSelectedSemester}
                     finalFilteredCourses={finalFilteredCourses}
                     selectedSection={selectedSection}
                     setSelectedSection={setSelectedSection}
                     routeType={routeType}
                     selectedItems={selectedItems}
                     setSelectedItems={setSelectedItems}
                  />

                  {/* Right content area */}
                  <StatsCard
                     selectedItems={
                        selectedItems.size > 0
                           ? selectedItems
                           : new Map([["selectedProfessor", selectedSection]])
                     }
                  />
               </div>
            )}
         </div>
         <div className="bottom-0 left-0 right-0 text-center text-xs text-gray-400 p-4">
            Developed by{" "}
            <a
               href="https://github.com/acmuta/mavgrades"
               target="_blank"
               className="hover:underline"
            >
               ACM @ UTA
            </a>
            . Not affiliated with or sponsored by UT Arlington.
            <br />© 2024{" "}
            <a href="https://acmuta.com" className="hover:underline">
               ACM @ UT Arlington
            </a>
            . All rights reserved.
         </div>
      </div>
   );
};

// Content needs to be wrapped in a Suspense tag to avoid CSR bailout due to useSearchParams()
const ResultsPage = () => {
   return (
      <Suspense fallback={<div>Loading...</div>}>
         <ResultsContent />
      </Suspense>
   );
};

export default ResultsPage;