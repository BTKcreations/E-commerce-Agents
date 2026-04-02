import { pgTable, serial, text, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const negotiationsTable = pgTable("negotiations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  currentOffer: decimal("current_offer", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("active"),
  rounds: integer("rounds").notNull().default(0),
  messageHistory: jsonb("message_history").$type<Array<{role: string, content: string}>>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNegotiationSchema = createInsertSchema(negotiationsTable).omit({ id: true, createdAt: true });
export type InsertNegotiation = z.infer<typeof insertNegotiationSchema>;
export type Negotiation = typeof negotiationsTable.$inferSelect;
