import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// Shared PostgreSQL connection pool
// Exported so all modules can reuse the same pool
const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "sql_class_2_db",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

export const db = drizzle(pool);
export default pool;
