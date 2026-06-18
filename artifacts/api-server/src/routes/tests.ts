import { Router } from "express";
import { db, testAnalyses, wrongQuestions } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateTestBody,
  UpdateTestBody,
  UpdateTestParams,
  DeleteTestParams,
  ListTestQuestionsParams,
  CreateTestQuestionBody,
  CreateTestQuestionParams,
  UpdateTestQuestionBody,
  UpdateTestQuestionParams,
  DeleteTestQuestionParams,
} from "@workspace/api-zod";

const router = Router();

function serializeTest(t: typeof testAnalyses.$inferSelect) {
  return { ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}
function serializeQ(q: typeof wrongQuestions.$inferSelect) {
  return { ...q, createdAt: q.createdAt.toISOString() };
}

router.get("/tests", async (_req, res) => {
  const rows = await db.select().from(testAnalyses).orderBy(testAnalyses.date);
  return res.json(rows.map(serializeTest));
});

router.post("/tests", async (req, res) => {
  const body = CreateTestBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });
  const [row] = await db.insert(testAnalyses).values({
    title: body.data.title,
    subject: body.data.subject,
    date: body.data.date,
    score: body.data.score ?? null,
    maxScore: body.data.maxScore ?? null,
    timeTaken: body.data.timeTaken ?? null,
    revised: body.data.revised ?? false,
    notes: body.data.notes ?? null,
  }).returning();
  return res.status(201).json(serializeTest(row));
});

router.patch("/tests/:id", async (req, res) => {
  const params = UpdateTestParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid params" });
  const body = UpdateTestBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });
  const existing = await db.select().from(testAnalyses).where(eq(testAnalyses.id, params.data.id));
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  const patch: Partial<typeof testAnalyses.$inferInsert> = { updatedAt: new Date() };
  if (body.data.title !== undefined) patch.title = body.data.title;
  if (body.data.subject !== undefined) patch.subject = body.data.subject;
  if (body.data.date !== undefined) patch.date = body.data.date;
  if (body.data.score !== undefined) patch.score = body.data.score ?? null;
  if (body.data.maxScore !== undefined) patch.maxScore = body.data.maxScore ?? null;
  if (body.data.timeTaken !== undefined) patch.timeTaken = body.data.timeTaken ?? null;
  if (body.data.revised !== undefined) patch.revised = body.data.revised;
  if (body.data.notes !== undefined) patch.notes = body.data.notes ?? null;

  const [updated] = await db.update(testAnalyses).set(patch).where(eq(testAnalyses.id, params.data.id)).returning();
  return res.json(serializeTest(updated));
});

router.delete("/tests/:id", async (req, res) => {
  const params = DeleteTestParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid params" });
  const existing = await db.select().from(testAnalyses).where(eq(testAnalyses.id, params.data.id));
  if (!existing.length) return res.status(404).json({ error: "Not found" });
  await db.delete(testAnalyses).where(eq(testAnalyses.id, params.data.id));
  return res.status(204).send();
});

router.get("/tests/:testId/questions", async (req, res) => {
  const params = ListTestQuestionsParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid params" });
  const rows = await db.select().from(wrongQuestions)
    .where(eq(wrongQuestions.testId, params.data.testId))
    .orderBy(wrongQuestions.createdAt);
  return res.json(rows.map(serializeQ));
});

router.post("/tests/:testId/questions", async (req, res) => {
  const params = CreateTestQuestionParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid params" });
  const body = CreateTestQuestionBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });
  const [row] = await db.insert(wrongQuestions).values({
    testId: params.data.testId,
    questionText: body.data.questionText ?? "",
    conceptualError: body.data.conceptualError ?? false,
    calculationMistake: body.data.calculationMistake ?? false,
    unknown: body.data.unknown ?? false,
    readingError: body.data.readingError ?? false,
    takeaway: body.data.takeaway ?? "",
  }).returning();
  return res.status(201).json(serializeQ(row));
});

router.patch("/tests/:testId/questions/:id", async (req, res) => {
  const params = UpdateTestQuestionParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid params" });
  const body = UpdateTestQuestionBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });
  const existing = await db.select().from(wrongQuestions).where(
    and(eq(wrongQuestions.id, params.data.id), eq(wrongQuestions.testId, params.data.testId))
  );
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  const patch: Partial<typeof wrongQuestions.$inferInsert> = {};
  if (body.data.questionText !== undefined) patch.questionText = body.data.questionText;
  if (body.data.conceptualError !== undefined) patch.conceptualError = body.data.conceptualError;
  if (body.data.calculationMistake !== undefined) patch.calculationMistake = body.data.calculationMistake;
  if (body.data.unknown !== undefined) patch.unknown = body.data.unknown;
  if (body.data.readingError !== undefined) patch.readingError = body.data.readingError;
  if (body.data.takeaway !== undefined) patch.takeaway = body.data.takeaway;

  const [updated] = await db.update(wrongQuestions).set(patch).where(eq(wrongQuestions.id, params.data.id)).returning();
  return res.json(serializeQ(updated));
});

router.delete("/tests/:testId/questions/:id", async (req, res) => {
  const params = DeleteTestQuestionParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid params" });
  const existing = await db.select().from(wrongQuestions).where(
    and(eq(wrongQuestions.id, params.data.id), eq(wrongQuestions.testId, params.data.testId))
  );
  if (!existing.length) return res.status(404).json({ error: "Not found" });
  await db.delete(wrongQuestions).where(eq(wrongQuestions.id, params.data.id));
  return res.status(204).send();
});

export default router;
