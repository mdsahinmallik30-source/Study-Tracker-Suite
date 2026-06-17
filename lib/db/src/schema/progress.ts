import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const progressItems = pgTable("progress_items", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category"),
  chapter: text("chapter"),
  totalQuestions: integer("total_questions"),
  completedQuestions: integer("completed_questions"),
  score: real("score"),
  status: text("status").notNull().default("not_started"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProgressSchema = createInsertSchema(progressItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type ProgressItem = typeof progressItems.$inferSelect;
