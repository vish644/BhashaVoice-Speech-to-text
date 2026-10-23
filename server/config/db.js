import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL pool error:", err.message);
});

// Test the database connection
export async function checkDBConnection() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_schema() AS schema,
        current_user AS user
    `);

    console.log("✅ PostgreSQL connected successfully!");
    console.log("📦 Database:", result.rows[0].database);
    console.log("📂 Schema:", result.rows[0].schema);
    console.log("👤 User:", result.rows[0].user);

    return true;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed!");
    console.error("Reason:", error.message);
    return false;
  }
}

// Create the table automatically if it doesn't exist
export async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.transcriptions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200),
        text TEXT NOT NULL,
        duration_seconds INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("✅ Table ready: public.transcriptions");
  } catch (error) {
    console.error("❌ Failed to initialize database table:", error.message);
    throw error;
  }
}
