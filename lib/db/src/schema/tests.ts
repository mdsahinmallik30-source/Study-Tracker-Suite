import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const testAnalyses = pgTable("test_analyses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull().default("mixed"),
  date: text("date").notNull(),
  score: real("score"),
  maxScore: real("max_score"),
  timeTaken: integer("time_taken"),
  revised: boolean("revised").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const wrongQuestions = pgTable("wrong_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => testAnalyses.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull().default(""),
  conceptualError: boolean("conceptual_error").notNull().default(false),
  calculationMistake: boolean("calculation_mistake").notNull().default(false),
  unknown: boolean("unknown").notNull().default(false),
  readingError: boolean("reading_error").notNull().default(false),
  takeaway: text("takeaway").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TestAnalysis = typeof testAnalyses.$inferSelect;
export type WrongQuestion = typeof wrongQuestions.$inferSelect;
