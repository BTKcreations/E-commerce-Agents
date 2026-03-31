import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function resetDb() {
  try {
    console.log("Dropping tables...");
    await db.execute(sql`DROP TABLE IF EXISTS reviews CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS products CASCADE`);
    
    console.log("Recreating products table...");
    await db.execute(sql`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        original_price TEXT,
        category TEXT NOT NULL,
        subcategory TEXT,
        brand TEXT,
        image_url TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        stock INTEGER NOT NULL DEFAULT 0,
        rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        specs JSONB DEFAULT '{}'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        demand_score REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Recreating reviews table...");
    await db.execute(sql`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database reset successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  }
}

resetDb();
