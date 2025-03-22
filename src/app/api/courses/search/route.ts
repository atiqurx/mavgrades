import { NextRequest, NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fetch from "node-fetch";
import { debounce } from "lodash";

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

async function getDatabaseConnection() {
  if (!db) {
    db = await open({
      filename: './public/data/grades.sqlite',
      driver: sqlite3.Database,
    });
  }
  return db;
}

const trackSearchInGA = debounce(async (query: string | null, course: string | null, professor: string | null) => {
  const GA_TRACKING_ID = "G-DENV8F61LB";
  console.log("Tracking GA Event (Debounced)", { query, course, professor });
  await fetch("https://www.google-analytics.com/collect", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
          v: "1",
          tid: GA_TRACKING_ID,
          cid: "101",
          t: "event",
          ec: "Search",
          ea: "query",
          el: query || course || professor || "",
          ev: "1",
      }),
  });
}, 300);

export async function GET(request: NextRequest) {
  const db = await getDatabaseConnection();
  const searchParams = new URL(request.url).searchParams;
  const searchInput = (searchParams.get("query") || "").trim().toLowerCase();
  const course = (searchParams.get("course") || "").trim().toLowerCase();
  const professor = (searchParams.get("professor") || "").trim().toLowerCase();
  const sort = searchParams.get("sort") || "course_number";
  const direction = searchParams.get("direction") || "asc";

  let suggestions = [];
  let courses = [];

  try {
    if (searchInput || course || professor) {
        await trackSearchInGA(searchInput, course, professor);
    }

    if (searchInput) {
      const inputNoSpaces = searchInput.replace(/\s+/g, ''); // Remove all spaces

      // Course Suggestions
      suggestions = await db.all(
          `SELECT DISTINCT suggestion, type
          FROM (
              SELECT DISTINCT
                  subject_id || ' ' || course_number || ' ' || course_title AS suggestion,
                  'course' AS type,
                  CASE
                      WHEN LOWER(subject_id || ' ' || course_number || ' ' || course_title) LIKE ? THEN 1  -- Exact or prefix match
                      WHEN REPLACE(LOWER(subject_id || ' ' || course_number), ' ', '') LIKE ? THEN 2  -- Prefix match (no spaces)
                      WHEN LOWER(course_title) LIKE ? THEN 3  -- Substring match within the title
                      ELSE 4
                  END as priority
              FROM allgrades
              WHERE LOWER(subject_id || ' ' || course_number || ' ' || course_title) LIKE ?
                  OR REPLACE(LOWER(subject_id || ' ' || course_number), ' ', '') LIKE ?
                  OR LOWER(course_title) LIKE ?
          )
          ORDER BY priority
          LIMIT 20`,
          [`${searchInput}%`, `${inputNoSpaces}%`, `%${searchInput}%`, `${searchInput}%`, `${inputNoSpaces}%`, `%${searchInput}%`]
      );

      // Professor Suggestions
      const professorSuggestions = await db.all(
          `SELECT DISTINCT suggestion, type
          FROM(
              SELECT DISTINCT
                  instructor1 AS suggestion,
                  'professor' AS type,
                  CASE
                      WHEN LOWER(instructor1) LIKE ? THEN 1
                      WHEN REPLACE(LOWER(instructor1), ' ', '') LIKE ? THEN 2
                      ELSE 3
                  END as priority
              FROM allgrades
              WHERE LOWER(instructor1) LIKE ?
              OR REPLACE(LOWER(instructor1), ' ', '') LIKE ?
          )
          ORDER BY priority
          LIMIT 20`,
          [`${searchInput}%`, `${inputNoSpaces}%`, `${searchInput}%`, `${inputNoSpaces}%`]
      );
      suggestions = suggestions.concat(professorSuggestions);

    }

    // Course and professor details queries
    if (course) {
      courses = await db.all(
          `SELECT DISTINCT subject_id, course_number, course_title, instructor1, section_number, semester, year, course_gpa,
          grades_count, grades_A, grades_B, grades_C, grades_D, grades_F, grades_I, grades_P, grades_Q,
          grades_W, grades_Z, grades_R
          FROM allgrades
          WHERE LOWER(subject_id || ' ' || course_number) = ?
          ORDER BY ${sort} ${direction}`,
          [course]
      );
    }

    if (professor) {
      courses = await db.all(
          `SELECT DISTINCT subject_id, course_number, course_title, instructor1, section_number, semester, year, course_gpa,
          grades_count, grades_A, grades_B, grades_C, grades_D, grades_F, grades_I, grades_P, grades_Q,
          grades_W, grades_Z, grades_R
          FROM allgrades
          WHERE LOWER(instructor1) = ?
          ORDER BY ${sort} ${direction}`,
          [professor]
      );
    }

    // Return suggestions or course details
    return NextResponse.json(suggestions.length > 0 ? suggestions : courses);

  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}