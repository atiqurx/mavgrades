import { open } from "sqlite";
import sqlite3 from "sqlite3";

async function getProfessorData(professorName: string) {
  const db = await open({
    filename: "public/data/professors.db",
    driver: sqlite3.Database,
  });

  const query = `
      SELECT rmp_name, url, department, quality_rating, difficulty_rating,
             total_ratings, would_take_again, tags
      FROM professors
      WHERE name = ?
   `;
  const data = await db.get(query, [professorName]);
  return data;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professorName = searchParams.get("name") || "";

  if (!professorName) {
    return new Response("Professor name is required", { status: 400 });
  }

  try {
    const professorData = await getProfessorData(professorName);
    return new Response(JSON.stringify(professorData), { status: 200 });
  } catch (error) {
    console.error("Error fetching professor data:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
