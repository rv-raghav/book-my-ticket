// Database setup script
// Run this once to create the database and all tables
// Usage: node db-setup.mjs

import "dotenv/config";
import pg from "pg";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
};

const DB_NAME = process.env.DB_NAME || "sql_class_2_db";

async function setup() {
  console.log("🔧 Starting database setup...\n");

  const hasConnectionString = !!process.env.DATABASE_URL;

  // Step 1: Connect to default 'postgres' database to create our database
  // Skip this if using a cloud provider (via DATABASE_URL), as they provision the DB for us
  if (!hasConnectionString) {
    const adminPool = new pg.Pool({ ...DB_CONFIG, database: "postgres" });

    try {
      const dbCheck = await adminPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [DB_NAME]
      );

      if (dbCheck.rowCount === 0) {
        await adminPool.query(`CREATE DATABASE ${DB_NAME}`);
        console.log(`✅ Database "${DB_NAME}" created`);
      } else {
        console.log(`✅ Database "${DB_NAME}" already exists`);
      }
    } catch (err) {
      console.error("❌ Error creating database:", err.message);
      process.exit(1);
    } finally {
      await adminPool.end();
    }
  } else {
      console.log(`✅ Using provided DATABASE_URL logic (skipping DB creation step)`);
  }

  // Step 2: Connect to our database and create tables
  const poolConfig = hasConnectionString
    ? { connectionString: process.env.DATABASE_URL }
    : { ...DB_CONFIG, database: DB_NAME };

  const appPool = new pg.Pool(poolConfig);

  try {
    // WIPE existings due to map sizing changes
    await appPool.query("DROP TABLE IF EXISTS bookings CASCADE;");
    await appPool.query("DROP TABLE IF EXISTS seats CASCADE;");
    console.log("✅ Wiped existing bookings and seats map");

    // Create seats table
    await appPool.query(`
      CREATE TABLE seats (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        isbooked INT DEFAULT 0
      );
    `);
    console.log("✅ Table 'seats' ready");

    // Seed exactly 100 seats for Cinema Layout
    await appPool.query(`
      INSERT INTO seats (isbooked) SELECT 0 FROM generate_series(1, 100);
    `);
    console.log("✅ Seeded 100 base seats");

    // Create users table
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Table 'users' ready");

    // Create bookings table
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id),
        seat_id INT NOT NULL REFERENCES seats(id),
        movie_id INT NOT NULL,
        booked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(seat_id, movie_id)
      );
    `);
    console.log("✅ Table 'bookings' ready");

    console.log("\n🎉 Database setup complete! You can now run: node index.mjs");
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
    process.exit(1);
  } finally {
    await appPool.end();
  }
}

setup();
