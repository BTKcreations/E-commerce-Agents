---
description: How to fully reset and re-seed the e-commerce database.
---

Follow these steps to wipe all data and start with a fresh set of products and categories.

### 1. Reset the Database Schema
This command will drop all existing tables (products, reviews, etc.) and recreate them according to the latest Drizzle schema. **Warning: This will delete all current data.**

// turbo
```bash
cd artifacts/api-server
npx tsx --env-file=../../.env ./src/scripts/reset-db.ts
```

### 2. Seed Fresh Data
After resetting the schema, run this command to fetch 25 new products from the DummyJSON API and populate the database.

// turbo
```bash
cd artifacts/api-server
npx tsx --env-file=../../.env ./src/scripts/seed-dummyjson.ts
```

### 3. Verify
You can now restart your dev server (if not already running) and view the fresh products on the home page.
