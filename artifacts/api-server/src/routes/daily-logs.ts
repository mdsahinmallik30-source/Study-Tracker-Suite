import { Router } from "express";
import { db, dailyLogs } from "@workspace/db";
import { eq, gte, lte, and, desc } from "drizzle-orm";
import {
  CreateDailyLogBody,
  UpdateDailyLogBody,
  UpdateDailyLogParams,
  ListDailyLogsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/daily-logs", async (req, res) => {
  const query = ListDailyLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const conditions = [];
  if (query.data.from) {
    conditions.push(gte(dailyLogs.date, query.data.from));
  }
  if (query.data.to) {
    conditions.push(lte(dailyLogs.date, query.data.to));
  }

  const logs = conditions.length > 0
    ? await db.select().from(dailyLogs).where(and(...conditions)).orderBy(desc(dailyLogs.date))
    : await db.select().from(dailyLogs).orderBy(desc(dailyLogs.date));

  return res.json(logs.map(log => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  })));
});

router.post("/daily-logs", async (req, res) => {
  const body = CreateDailyLogBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const existing = await db.select().from(dailyLogs).where(eq(dailyLogs.date, body.data.date));
  if (existing.length > 0) {
    const [updated] = await db.update(dailyLogs)
      .set({
        lectures: body.data.lectures ?? false,
        dpp: body.data.dpp ?? false,
        revision: body.data.revision ?? false,
        homework: body.data.homework ?? false,
        notes: body.data.notes ?? null,
      })
      .where(eq(dailyLogs.date, body.data.date))
      .returning();
    return res.status(201).json({ ...updated, createdAt: updated.createdAt.toISOString() });
  }

  const [log] = await db.insert(dailyLogs).values({
    date: body.data.date,
    lectures: body.data.lectures ?? false,
    dpp: body.data.dpp ?? false,
    revision: body.data.revision ?? false,
    homework: body.data.homework ?? false,
    notes: body.data.notes ?? null,
  }).returning();

  return res.status(201).json({ ...log, createdAt: log.createdAt.toISOString() });
});

router.get("/daily-logs/streak", async (_req, res) => {
  const allLogs = await db.select().from(dailyLogs).orderBy(desc(dailyLogs.date));

  const totalDaysLogged = allLogs.length;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logDates = new Set(allLogs.map(l => l.date));

  let checkDate = new Date(today);
  let streakBroken = false;
  while (!streakBroken) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (logDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      streakBroken = true;
    }
  }

  for (let i = 0; i < allLogs.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(allLogs[i - 1].date);
      const curr = new Date(allLogs[i].date);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const last30DaysCompletion = [];
  for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const log = allLogs.find(l => l.date === dateStr);
    const completedCount = log
      ? [log.lectures, log.dpp, log.revision, log.homework].filter(Boolean).length
      : 0;
    last30DaysCompletion.push({ date: dateStr, completedCount, totalCount: 4 });
  }

  return res.json({ currentStreak, longestStreak, totalDaysLogged, last30DaysCompletion });
});

router.patch("/daily-logs/:id", async (req, res) => {
  const params = UpdateDailyLogParams.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const body = UpdateDailyLogBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const existing = await db.select().from(dailyLogs).where(eq(dailyLogs.id, params.data.id));
  if (!existing.length) {
    return res.status(404).json({ error: "Not found" });
  }

  const updateData: Partial<typeof dailyLogs.$inferInsert> = {};
  if (body.data.lectures !== undefined) updateData.lectures = body.data.lectures;
  if (body.data.dpp !== undefined) updateData.dpp = body.data.dpp;
  if (body.data.revision !== undefined) updateData.revision = body.data.revision;
  if (body.data.homework !== undefined) updateData.homework = body.data.homework;
  if (body.data.notes !== undefined) updateData.notes = body.data.notes ?? null;

  const [updated] = await db.update(dailyLogs)
    .set(updateData)
    .where(eq(dailyLogs.id, params.data.id))
    .returning();

  return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
