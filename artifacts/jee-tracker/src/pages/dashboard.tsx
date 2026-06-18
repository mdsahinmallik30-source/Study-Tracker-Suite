import { useGetDailyStreak, useGetProgressSummary, useListDailyLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, BookOpen, Clock, Activity } from "lucide-react";
import { format } from "date-fns";

type CustomTask = { id: string; label: string; done: boolean };

export default function Dashboard() {
  const { data: streak, isLoading: loadingStreak } = useGetDailyStreak();
  const { data: summary, isLoading: loadingSummary } = useGetProgressSummary();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: logs, isLoading: loadingLogs } = useListDailyLogs({ from: today, to: today });

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
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
            <Flame className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loadingStreak ? (
              <div className="h-8 bg-secondary animate-pulse rounded w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{streak?.currentStreak || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Longest: {streak?.longestStreak || 0} days</p>
              </>
            )}
          </CardContent>
        </Card>

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
                <Progress
                  value={summary?.overallTotal ? (summary.overallCompleted / summary.overallTotal) * 100 : 0}
                  className="h-2 mt-3"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Study Days</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loadingStreak ? (
              <div className="h-8 bg-secondary animate-pulse rounded w-16" />
            ) : (
              <div className="text-3xl font-bold">{streak?.totalDaysLogged || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingLogs ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-11 bg-secondary animate-pulse rounded-md" />)}
              </div>
            ) : (
              <>
                {defaultItems.map(({ key, label }) => {
                  const isDone = todayLog ? (todayLog as Record<string, unknown>)[key] as boolean : false;
                  return (
                    <StatusRow key={key} label={label} done={isDone} />
                  );
                })}
                {customTasks.map(task => (
                  <StatusRow key={task.id} label={task.label} done={task.done} isCustom />
                ))}
                {customTasks.length === 0 && !todayLog && (
                  <p className="text-xs text-muted-foreground pt-1 pl-1">
                    Head to Daily Log to check off today's tasks.
                  </p>
                )}
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
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded-md" />)}
              </div>
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
    </div>
  );
}

function StatusRow({ label, done, isCustom = false }: { label: string; done: boolean; isCustom?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors
      ${done ? "bg-primary/5 border-primary/20" : "bg-secondary/40 border-border/50"}`}>
      <span className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
        {label}
        {isCustom && <span className="ml-2 text-xs text-muted-foreground font-normal">(custom)</span>}
      </span>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all
        ${done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
        {done && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </div>
  );
}
