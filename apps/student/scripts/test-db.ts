import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { pool } = await import("../lib/db");

  try {
    const result = await pool.query(
      "SELECT current_database() AS database_name, current_user AS database_user"
    );

    console.log("Database connection successful!");
    console.log(result.rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Database connection failed:", error.message);
  process.exitCode = 1;
});