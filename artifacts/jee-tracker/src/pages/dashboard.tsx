import { useState } from "react";
import {
  useGetDailyStreak, useGetProgressSummary, useListDailyLogs,
  useGetWeeklyProgress, useListSubjectTargets, useUpsertSubjectTarget,
  useGetTestErrorStats,
  getListSubjectTargetsQueryKey, getGetWeeklyProgressQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame, Target, BookOpen, Clock, Activity, Check, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

type CustomTask = { id: string; label: string; done: boolean };

const SUBJECT_COLORS = {
  physics: { ring: "#3b82f6", bg: "bg-blue-500/10", text: "text-blue-400", label: "Physics" },
  chemistry: { ring: "#22c55e", bg: "bg-green-500/10", text: "text-green-400", label: "Chemistry" },
  maths: { ring: "#a855f7", bg: "bg-purple-500/10", text: "text-purple-400", label: "Maths" },
};

const ERROR_COLORS = {
  conceptualError: { label: "Conceptual", color: "#ef4444", bg: "bg-red-500" },
  calculationMistake: { label: "Calculation", color: "#eab308", bg: "bg-yellow-500" },
  readingError: { label: "Reading", color: "#06b6d4", bg: "bg-cyan-500" },
  unknown: { label: "Unknown", color: "#94a3b8", bg: "bg-slate-400" },
};

export default function Dashboard() {
  const { data: streak, isLoading: loadingStreak } = useGetDailyStreak();
  const { data: summary, isLoading: loadingSummary } = useGetProgressSummary();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: logs, isLoading: loadingLogs } = useListDailyLogs({ from: today, to: today });
  const { data: weeklyProgress, isLoading: loadingWeekly } = useGetWeeklyProgress();
  const { data: errorStats, isLoading: loadingErrors } = useGetTestErrorStats();

  const todayLog = logs?.[0];
  const customTasks: CustomTask[] = (todayLog?.customTasks as CustomTask[] | null | undefined) ?? [];

  const defaultItems = [
    { key: "lectures", label: "Video Lectures" },
    { key: "dpp", label: "Daily Practice Problems" },
    { key: "revision", label: "Revision" },
    { key: "homework", label: "Homework" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your command center for JEE preparation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Current Streak"
          icon={<Flame className="w-4 h-4 text-orange-500" />}
          loading={loadingStreak}
          value={`${streak?.currentStreak || 0}`}
          sub={`Longest: ${streak?.longestStreak || 0} days`}
        />
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Completion</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-8 bg-secondary animate-pulse rounded w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {summary?.overallTotal ? Math.round((summary.overallCompleted / summary.overallTotal) * 100) : 0}%
                </div>
                <Progress value={summary?.overallTotal ? (summary.overallCompleted / summary.overallTotal) * 100 : 0} className="h-2 mt-3" />
              </>
            )}
          </CardContent>
        </Card>
        <StatCard
          label="Total Study Days"
          icon={<Activity className="w-4 h-4 text-green-500" />}
          loading={loadingStreak}
          value={`${streak?.totalDaysLogged || 0}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingLogs ? (
              <div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-11 bg-secondary animate-pulse rounded-md" />)}</div>
            ) : (
              <>
                {defaultItems.map(({ key, label }) => {
                  const isDone = todayLog ? ((todayLog as unknown) as Record<string, unknown>)[key] as boolean : false;
                  return <StatusRow key={key} label={label} done={isDone} />;
                })}
                {customTasks.map(task => (
                  <StatusRow key={task.id} label={task.label} done={task.done} isCustom />
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Subject Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded-md" />)}</div>
            ) : (
              <div className="space-y-5">
                {summary?.subjects.map(subject => {
                  const percent = subject.totalItems ? (subject.completedItems / subject.totalItems) * 100 : 0;
                  return (
                    <div key={subject.subject} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="font-medium capitalize">{subject.subject}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(percent)}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{subject.completedItems} Completed</span>
                        <span>{subject.inProgressItems} In Progress</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WeeklyTargetsCard weeklyProgress={weeklyProgress} isLoading={loadingWeekly} />

      <ErrorHeatmapCard stats={errorStats || []} isLoading={loadingErrors} />
    </div>
  );
}

function StatCard({ label, icon, loading, value, sub }: {
  label: string; icon: React.ReactNode; loading: boolean; value: string; sub?: string;
}) {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <div className="h-8 bg-secondary animate-pulse rounded w-16" /> : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, done, isCustom = false }: { label: string; done: boolean; isCustom?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors
      ${done ? "bg-primary/5 border-primary/20" : "bg-secondary/40 border-border/50"}`}>
      <span className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
        {label}{isCustom && <span className="ml-2 text-xs text-muted-foreground font-normal">(custom)</span>}
      </span>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all
        ${done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
        {done && <Check className="w-3 h-3 text-white" />}
      </div>
    </div>
  );
}

function WeeklyTargetsCard({ weeklyProgress, isLoading }: { weeklyProgress: any; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const upsert = useUpsertSubjectTarget();
  const { data: targets } = useListSubjectTargets();
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListSubjectTargetsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWeeklyProgressQueryKey() });
  };

  const handleSave = (subject: string) => {
    const v = parseInt(editValue);
    if (!isNaN(v) && v > 0) {
      upsert.mutate({ data: { subject, weeklyTarget: v } }, { onSuccess: invalidate });
    }
    setEditingSubject(null);
  };

  const subjects = weeklyProgress?.subjects || [
    { subject: "physics", target: 5, completed: 0 },
    { subject: "chemistry", target: 5, completed: 0 },
    { subject: "maths", target: 5, completed: 0 },
  ];

  const weekLabel = weeklyProgress
    ? `${format(new Date(weeklyProgress.weekStart), "MMM d")} – ${format(new Date(weeklyProgress.weekEnd), "MMM d")}`
    : "This Week";

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Weekly Targets
          </CardTitle>
          <span className="text-xs text-muted-foreground">{weekLabel}</span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-around py-4">
            {[1, 2, 3].map(i => <div key={i} className="w-28 h-28 rounded-full bg-secondary animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {subjects.map((s: any) => {
              const colors = SUBJECT_COLORS[s.subject as keyof typeof SUBJECT_COLORS];
              const target = s.target || 5;
              const completed = Math.min(s.completed, target);
              const percent = (completed / target) * 100;
              const r = 42;
              const circ = 2 * Math.PI * r;
              const filled = (percent / 100) * circ;
              const isEditing = editingSubject === s.subject;

              return (
                <div key={s.subject} className="flex flex-col items-center gap-3">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-secondary" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r={r} fill="none"
                        stroke={colors.ring}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={circ - filled}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-xl font-bold ${colors.text}`}>{completed}</span>
                      <span className="text-xs text-muted-foreground">/ {target}</span>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className={`font-semibold text-sm ${colors.text}`}>{colors.label}</p>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleSave(s.subject); if (e.key === "Escape") setEditingSubject(null); }}
                          className="h-7 w-16 text-center text-xs px-1"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSave(s.subject)}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingSubject(s.subject); setEditValue(String(target)); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <span>Target: {target}/wk</span>
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Chapters marked complete this week. Click "Target: X/wk" to edit your goal.
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorHeatmapCard({ stats, isLoading }: { stats: any[]; isLoading: boolean }) {
  if (!isLoading && stats.length === 0) return null;

  const totalByType = stats.reduce(
    (acc, s) => {
      acc.conceptualError += s.conceptualError;
      acc.calculationMistake += s.calculationMistake;
      acc.readingError += s.readingError;
      acc.unknown += s.unknown;
      return acc;
    },
    { conceptualError: 0, calculationMistake: 0, readingError: 0, unknown: 0 }
  );
  const grandTotal = totalByType.conceptualError + totalByType.calculationMistake + totalByType.readingError + totalByType.unknown;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Mistake Patterns
        </CardTitle>
        <p className="text-xs text-muted-foreground">Error type breakdown across all your test analyses</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-secondary animate-pulse rounded" />)}</div>
        ) : (
          <>
            {grandTotal > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall breakdown ({grandTotal} total errors)</p>
                <div className="flex rounded-full overflow-hidden h-4 gap-0.5">
                  {(Object.entries(ERROR_COLORS) as [string, { label: string; color: string; bg: string }][]).map(([key, c]) => {
                    const val = totalByType[key as keyof typeof totalByType];
                    const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
                    return pct > 0 ? (
                      <div key={key} title={`${c.label}: ${val}`} className={`${c.bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    ) : null;
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {(Object.entries(ERROR_COLORS) as [string, { label: string; color: string; bg: string }][]).map(([key, c]) => {
                    const val = totalByType[key as keyof typeof totalByType];
                    if (val === 0) return null;
                    return (
                      <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${c.bg}`} />
                        {c.label}: <span className="text-foreground font-medium">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Month</p>
                <div className="space-y-2">
                  {stats.slice(-6).map((s: any) => {
                    const total = s.total || 1;
                    const monthLabel = format(new Date(`${s.month}-01`), "MMM yyyy");
                    return (
                      <div key={s.month} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">{monthLabel}</span>
                        <div className="flex-1 flex rounded overflow-hidden h-5 gap-px bg-secondary/50">
                          {(Object.entries(ERROR_COLORS) as [string, { label: string; color: string; bg: string }][]).map(([key, c]) => {
                            const val = s[key];
                            const pct = total > 0 ? (val / total) * 100 : 0;
                            return pct > 0 ? (
                              <div
                                key={key}
                                title={`${c.label}: ${val}`}
                                className={`${c.bg} flex items-center justify-center text-white text-[10px] font-bold transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              >
                                {pct > 15 ? val : ""}
                              </div>
                            ) : null;
                          })}
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{s.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
