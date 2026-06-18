import { useState, useRef } from "react";
import { useListDailyLogs, useCreateDailyLog, useUpdateDailyLog, getListDailyLogsQueryKey, getGetDailyStreakQueryKey } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";

type CustomTask = { id: string; label: string; done: boolean };

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useListDailyLogs({
    from: format(monthStart, "yyyy-MM-dd"),
    to: format(monthEnd, "yyyy-MM-dd"),
  });

  const createLog = useCreateDailyLog();
  const updateLog = useUpdateDailyLog();

  const currentLog = logs?.find(l => l.date === dateStr);
  const customTasks: CustomTask[] = (currentLog?.customTasks as CustomTask[] | null | undefined) ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListDailyLogsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDailyStreakQueryKey() });
  };

  const saveUpdate = (patch: Record<string, unknown>) => {
    if (currentLog) {
      updateLog.mutate({ id: currentLog.id, data: patch as Parameters<typeof updateLog.mutate>[0]["data"] }, { onSuccess: invalidate });
    } else {
      createLog.mutate({
        data: {
          date: dateStr,
          lectures: false,
          dpp: false,
          revision: false,
          homework: false,
          customTasks: [],
          ...patch,
        } as Parameters<typeof createLog.mutate>[0]["data"],
      }, { onSuccess: invalidate });
    }
  };

  const handleToggle = (field: "lectures" | "dpp" | "revision" | "homework", checked: boolean) => {
    saveUpdate({ [field]: checked });
  };

  const handleToggleCustom = (taskId: string, checked: boolean) => {
    const updated = customTasks.map(t => t.id === taskId ? { ...t, done: checked } : t);
    saveUpdate({ customTasks: updated });
  };

  const handleAddTask = () => {
    const label = newTaskLabel.trim();
    if (!label) return;
    const newTask: CustomTask = { id: generateId(), label, done: false };
    const updated = [...customTasks, newTask];
    saveUpdate({ customTasks: updated });
    setNewTaskLabel("");
    addInputRef.current?.focus();
  };

  const handleRemoveTask = (taskId: string) => {
    const updated = customTasks.filter(t => t.id !== taskId);
    saveUpdate({ customTasks: updated });
  };

  const handleNotesChange = (notes: string) => {
    saveUpdate({ notes });
  };

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Log</h1>
        <p className="text-muted-foreground mt-1">Track your daily study habits and build streaks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 border-border/50">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2 text-muted-foreground font-medium">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              {daysInMonth.map(day => {
                const isSelected = format(day, "yyyy-MM-dd") === dateStr;
                const log = logs?.find(l => l.date === format(day, "yyyy-MM-dd"));
                const hasActivity = log && (log.lectures || log.dpp || log.revision || log.homework);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(new Date(day))}
                    className={`aspect-square p-2 rounded-md flex items-center justify-center text-sm transition-all
                      ${isSelected ? "bg-primary text-primary-foreground font-bold shadow-md scale-105" : "hover:bg-secondary"}
                      ${!isSelected && hasActivity ? "text-primary font-bold" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{format(selectedDate, "EEEE, MMMM do, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-secondary animate-pulse rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: "lectures" as const, label: "Completed Video Lectures" },
                    { key: "dpp" as const, label: "Solved Daily Practice Problems" },
                    { key: "revision" as const, label: "Revised Notes" },
                    { key: "homework" as const, label: "Finished Homework" },
                  ].map(({ key, label }) => (
                    <TaskRow
                      key={key}
                      id={key}
                      label={label}
                      checked={currentLog?.[key] || false}
                      onToggle={(c) => handleToggle(key, c)}
                    />
                  ))}

                  {customTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      id={task.id}
                      label={task.label}
                      checked={task.done}
                      onToggle={(c) => handleToggleCustom(task.id, c)}
                      isCustom
                      onRemove={() => handleRemoveTask(task.id)}
                    />
                  ))}

                  <div className="flex gap-2 pt-2">
                    <Input
                      ref={addInputRef}
                      placeholder="Add a task for today..."
                      value={newTaskLabel}
                      onChange={e => setNewTaskLabel(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddTask()}
                      className="h-10 bg-secondary/30 border-dashed border-border focus:border-primary"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleAddTask}
                      disabled={!newTaskLabel.trim()}
                      className="h-10 w-10 shrink-0 border-dashed border-border hover:border-primary hover:text-primary"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground pl-1">
                    Custom tasks are temporary — only visible on this day's log.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes & Reflections</label>
                <Textarea
                  placeholder="What did you learn today? What was difficult?"
                  className="min-h-[100px] resize-none"
                  key={currentLog?.id ?? dateStr}
                  defaultValue={currentLog?.notes || ""}
                  onBlur={(e) => handleNotesChange(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  id,
  label,
  checked,
  onToggle,
  isCustom = false,
  onRemove,
}: {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  isCustom?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className={`group flex items-center gap-3 p-4 rounded-lg border transition-all duration-150
      ${checked
        ? "bg-primary/5 border-primary/30"
        : "bg-secondary/30 border-border/50 hover:bg-secondary/50"}
    `}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={v => onToggle(v as boolean)}
        className="w-5 h-5 rounded-sm border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <label
        htmlFor={id}
        className={`flex-1 text-base font-medium leading-none cursor-pointer transition-colors ${checked ? "line-through text-muted-foreground" : ""}`}
      >
        {label}
      </label>
      {isCustom && onRemove && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
