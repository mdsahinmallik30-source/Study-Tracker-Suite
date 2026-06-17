import { Router } from "express";
import { db, progressItems } from "@workspace/db";
import { eq, and, avg, count, sql } from "drizzle-orm";
import {
  CreateProgressBody,
  UpdateProgressBody,
  UpdateProgressParams,
  ListProgressQueryParams,
  DeleteProgressParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/progress", async (req, res) => {
  const query = ListProgressQueryParams.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const conditions = [];
  if (query.data.subject) {
    conditions.push(eq(progressItems.subject, query.data.subject));
  }
  if (query.data.category) {
    conditions.push(eq(progressItems.category, query.data.category));
  }

  const items = conditions.length > 0
    ? await db.select().from(progressItems).where(and(...conditions)).orderBy(progressItems.createdAt)
    : await db.select().from(progressItems).orderBy(progressItems.createdAt);

  return res.json(items.map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  })));
});

router.post("/progress", async (req, res) => {
  const body = CreateProgressBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const [item] = await db.insert(progressItems).values({
    subject: body.data.subject,
    category: body.data.category,
    subCategory: body.data.subCategory ?? null,
    chapter: body.data.chapter ?? null,
    totalQuestions: body.data.totalQuestions ?? null,
    completedQuestions: body.data.completedQuestions ?? null,
    score: body.data.score ?? null,
    status: body.data.status,
    notes: body.data.notes ?? null,
  }).returning();

  return res.status(201).json({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });
});

router.get("/progress/summary", async (_req, res) => {
  const subjects = ["physics", "chemistry", "maths"];
  const categories = ["dpp", "jee_replica", "practice_sheet", "chapterwise_test", "cengage", "exercise_book"];

  const allItems = await db.select().from(progressItems);

  const subjectSummaries = subjects.map(subject => {
    const subjectItems = allItems.filter(i => i.subject === subject);
    const completedItems = subjectItems.filter(i => i.status === "completed").length;
    const inProgressItems = subjectItems.filter(i => i.status === "in_progress").length;
    const scores = subjectItems.filter(i => i.score !== null).map(i => i.score as number);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const byCategory = categories.map(category => {
      const catItems = subjectItems.filter(i => i.category === category);
      const catCompleted = catItems.filter(i => i.status === "completed").length;
      const catScores = catItems.filter(i => i.score !== null).map(i => i.score as number);
      const catAvg = catScores.length > 0 ? catScores.reduce((a, b) => a + b, 0) / catScores.length : null;
      return {
        category,
        totalItems: catItems.length,
        completedItems: catCompleted,
        avgScore: catAvg,
      };
    });

    return {
      subject,
      totalItems: subjectItems.length,
      completedItems,
      inProgressItems,
      avgScore,
      byCategory,
    };
  });

  return res.json({
    subjects: subjectSummaries,
    overallCompleted: allItems.filter(i => i.status === "completed").length,
    overallTotal: allItems.length,
  });
});

router.patch("/progress/:id", async (req, res) => {
  const params = UpdateProgressParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const body = UpdateProgressBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const existing = await db.select().from(progressItems).where(eq(progressItems.id, params.data.id));
  if (!existing.length) {
    return res.status(404).json({ error: "Not found" });
  }

  const updateData: Partial<typeof progressItems.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.data.subCategory !== undefined) updateData.subCategory = body.data.subCategory ?? null;
  if (body.data.chapter !== undefined) updateData.chapter = body.data.chapter ?? null;
  if (body.data.totalQuestions !== undefined) updateData.totalQuestions = body.data.totalQuestions ?? null;
  if (body.data.completedQuestions !== undefined) updateData.completedQuestions = body.data.completedQuestions ?? null;
  if (body.data.score !== undefined) updateData.score = body.data.score ?? null;
  if (body.data.status !== undefined) updateData.status = body.data.status;
  if (body.data.notes !== undefined) updateData.notes = body.data.notes ?? null;

  const [updated] = await db.update(progressItems)
    .set(updateData)
    .where(eq(progressItems.id, params.data.id))
    .returning();

  return res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/progress/:id", async (req, res) => {
  const params = DeleteProgressParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const existing = await db.select().from(progressItems).where(eq(progressItems.id, params.data.id));
  if (!existing.length) {
    return res.status(404).json({ error: "Not found" });
  }

  await db.delete(progressItems).where(eq(progressItems.id, params.data.id));
  return res.status(204).send();
});

export default router;
