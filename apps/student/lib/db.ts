import "server-only";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const globalForPg = globalThis as unknown as {
  atlasPgPool?: Pool;
};

export const pool =
  globalForPg.atlasPgPool ??
  new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
     globalForPg.atlasPgPool = pool;
}