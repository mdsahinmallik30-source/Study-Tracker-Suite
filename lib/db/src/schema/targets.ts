import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const subjectTargets = pgTable("subject_targets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull().unique(),
  weeklyTarget: integer("weekly_target").notNull().default(5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SubjectTarget = typeof subjectTargets.$inferSelect;
