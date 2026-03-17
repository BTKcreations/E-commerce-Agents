import { pgTable, serial, text, decimal, integer, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  category: text("category").notNull(),
  brand: text("brand"),
  imageUrl: text("image_url"),
  stock: integer("stock").notNull().default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  specs: jsonb("specs"),
  tags: jsonb("tags"),
  demandScore: real("demand_score").default(0.5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
