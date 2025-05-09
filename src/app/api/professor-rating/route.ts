import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "node:fs";
import { LRUCache } from "lru-cache";

// LRU cache for query results 
const cache = new LRUCache<string, any>({
  max: 1_000,          // keep up to 1 000 entries
  ttl: 1_000 * 60 * 60 // 1 hour
});

//  Lazy database connection                 
let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null =
  null;

async function getDatabase() {
  if (!dbPromise) {
    const dbPath = path.join(process.cwd(), "public", "data", "professors.db");
    console.log("[DB] opening:", dbPath);

    if (!fs.existsSync(dbPath)) {
      console.error("[DB] file does NOT exist in λ package");
      throw new Error("Database file not bundled ‑ check vercel.json includeFiles");
    }

    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY   // read‑only: no write‑lock on Vercel FS
    })
      .then(db => {
        console.log("[DB] connection established");
        return db;
      })
      .catch(err => {
        console.error("[DB] FAILED to open:", err);
        throw err;
      });
  }
  return dbPromise;
}

// Data‑access helper (with caching + logging)                   
async function getProfessorData(professorName: string) {
  if (cache.has(professorName)) {
    console.log(`[CACHE] hit: "${professorName}"`);
    return cache.get(professorName);
  }

  const db = await getDatabase();

  const sql = `
    SELECT rmp_name, url, department, quality_rating, difficulty_rating,
           total_ratings, would_take_again, tags
    FROM   professors
    WHERE  name = ?;
  `;

  console.log("[SQL] executing:", sql.trim(), "param:", professorName);

  const row = await db.get(sql, [professorName]);

  console.log("[SQL] result:", row);

  if (row) cache.set(professorName, row);
  return row;
}

//  Route handler                                                 
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professorName = (searchParams.get("name") || "").trim();

  if (!professorName) {
    return new Response("Professor name is required", { status: 400 });
  }

  try {
    const data = await getProfessorData(professorName);
    if (!data) {
      return new Response("Professor not found", { status: 404 });
    }
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error("[ROUTE] error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
