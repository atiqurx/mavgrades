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
    await db.exec("PRAGMA cache_size = 10000"); // Increase cache size
    await db.exec("PRAGMA temp_store = MEMORY"); // Store temporary tables 
  }
  return db;
}

async function getSuggestions(db: Database<sqlite3.Database, sqlite3.Statement>, searchInput: string) {
  const inputNoSpaces = searchInput.replace(/\s+/g, '').toLowerCase();
  const fuzzyInput = `%${searchInput}%`;

  const courseSuggestions = await db.all(
    `SELECT DISTINCT suggestion, type
     FROM (
       SELECT DISTINCT
         subject_id || ' ' || course_number || ' ' || course_title AS suggestion,
         'course' AS type,
         CASE
           WHEN LOWER(course_number) = ? THEN 1 -- Exact match for standalone course number
           WHEN LOWER(subject_id || ' ' || course_number || ' ' || course_title) LIKE ? THEN 2 -- Exact or prefix match
           WHEN REPLACE(LOWER(subject_id || ' ' || course_number), ' ', '') LIKE ? THEN 3 -- Prefix match (no spaces)
           WHEN LOWER(course_title) LIKE ? THEN 4 -- Substring match within the title
           ELSE 5
         END as priority
       FROM allgrades
       WHERE LOWER(course_number) = ?
         OR LOWER(subject_id || ' ' || course_number || ' ' || course_title) LIKE ?
         OR REPLACE(LOWER(subject_id || ' ' || course_number), ' ', '') LIKE ?
         OR LOWER(course_title) LIKE ?
     )
     ORDER BY priority, suggestion ASC
     LIMIT 20`,
    [searchInput, searchInput + '%', inputNoSpaces + '%', fuzzyInput, searchInput, searchInput + '%', inputNoSpaces + '%', fuzzyInput]
  );

  const professorSuggestions = await db.all(
    `SELECT DISTINCT suggestion, type
     FROM (
       SELECT DISTINCT
         instructor1 AS suggestion,
         'professor' AS type,
         CASE
           WHEN LOWER(instructor1) LIKE ? THEN 1 -- Exact or prefix match
           WHEN REPLACE(LOWER(instructor1), ' ', '') LIKE ? THEN 2 -- Prefix match (no spaces)
           ELSE 3 -- Fuzzy match or substring match
         END as priority
       FROM allgrades
       WHERE LOWER(instructor1) LIKE ?
         OR REPLACE(LOWER(instructor1), ' ', '') LIKE ?
     )
     ORDER BY priority, suggestion ASC
     LIMIT 20`,
    [searchInput + '%', inputNoSpaces + '%', fuzzyInput, inputNoSpaces + '%']
  );

  return [...courseSuggestions, ...professorSuggestions];
}


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
    if (searchInput) {
      suggestions = await getSuggestions(db, searchInput);
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

    // Return suggestions or course details based on input
    return NextResponse.json(suggestions.length > 0 ? suggestions : courses);

  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
