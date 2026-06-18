import { Router } from "express";
import { db, subjectTargets, progressItems } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";
import { UpsertSubjectTargetBody } from "@workspace/api-zod";

const router = Router();

function getWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return { weekStart, weekEnd };
}

router.get("/subject-targets", async (_req, res) => {
  const rows = await db.select().from(subjectTargets).orderBy(subjectTargets.subject);
  return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
});

router.post("/subject-targets", async (req, res) => {
  const body = UpsertSubjectTargetBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const existing = await db.select().from(subjectTargets).where(eq(subjectTargets.subject, body.data.subject));
  if (existing.length > 0) {
    const [updated] = await db.update(subjectTargets)
      .set({ weeklyTarget: body.data.weeklyTarget, updatedAt: new Date() })
      .where(eq(subjectTargets.subject, body.data.subject))
      .returning();
    return res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
  }

  const [created] = await db.insert(subjectTargets)
    .values({ subject: body.data.subject, weeklyTarget: body.data.weeklyTarget })
    .returning();
  return res.json({ ...created, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString() });
});

router.get("/subject-targets/weekly-progress", async (_req, res) => {
  const { weekStart, weekEnd } = getWeekBounds();
  const subjects = ["physics", "chemistry", "maths"];

  const targets = await db.select().from(subjectTargets);
  const targetMap = Object.fromEntries(targets.map(t => [t.subject, t.weeklyTarget]));

  const completedItems = await db.select().from(progressItems)
    .where(and(eq(progressItems.status, "completed"), gte(progressItems.updatedAt, weekStart), lt(progressItems.updatedAt, weekEnd)));

  const completedBySubject = subjects.reduce((acc, s) => {
    acc[s] = completedItems.filter(i => i.subject === s).length;
    return acc;
  }, {} as Record<string, number>);

  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndDate = new Date(weekEnd);
  weekEndDate.setDate(weekEndDate.getDate() - 1);
  const weekEndStr = weekEndDate.toISOString().split("T")[0];

  return res.json({
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    subjects: subjects.map(s => ({
      subject: s,
      target: targetMap[s] ?? 5,
      completed: completedBySubject[s] ?? 0,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
    })),
  });
});

export default router;
