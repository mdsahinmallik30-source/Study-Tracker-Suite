import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  lectures: boolean("lectures").notNull().default(false),
  dpp: boolean("dpp").notNull().default(false),
  revision: boolean("revision").notNull().default(false),
  homework: boolean("homework").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true });
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;
