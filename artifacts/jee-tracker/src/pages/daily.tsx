import { useState } from "react";
import { useListDailyLogs, useCreateDailyLog, useUpdateDailyLog, getListDailyLogsQueryKey, getGetDailyStreakQueryKey } from "@workspace/api-client-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  const queryClient = useQueryClient();
  
  const { data: logs, isLoading } = useListDailyLogs({
    from: format(monthStart, "yyyy-MM-dd"),
    to: format(monthEnd, "yyyy-MM-dd")
  });

  const createLog = useCreateDailyLog();
  const updateLog = useUpdateDailyLog();

  const currentLog = logs?.find(l => l.date === dateStr);

  const handleToggle = (field: 'lectures' | 'dpp' | 'revision' | 'homework', checked: boolean) => {
    if (currentLog) {
      updateLog.mutate({
        id: currentLog.id,
        data: { [field]: checked }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDailyLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDailyStreakQueryKey() });
        }
      });
    } else {
      createLog.mutate({
        data: {
          date: dateStr,
          lectures: false,
          dpp: false,
          revision: false,
          homework: false,
          [field]: checked
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDailyLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDailyStreakQueryKey() });
        }
      });
    }
  };

  const handleNotesChange = (notes: string) => {
    if (currentLog) {
      updateLog.mutate({
        id: currentLog.id,
        data: { notes }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDailyLogsQueryKey() });
        }
      });
    } else {
      createLog.mutate({
        data: {
          date: dateStr,
          notes,
          lectures: false,
          dpp: false,
          revision: false,
          homework: false,
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDailyLogsQueryKey() });
        }
      });
    }
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
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
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
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square p-2 rounded-md flex items-center justify-center text-sm transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-md scale-105' : 'hover:bg-secondary'}
                      ${!isSelected && hasActivity ? 'text-primary font-bold' : ''}
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
              <div className="space-y-4">
                {[
                  { key: 'lectures' as const, label: 'Completed Video Lectures' },
                  { key: 'dpp' as const, label: 'Solved Daily Practice Problems' },
                  { key: 'revision' as const, label: 'Revised Notes' },
                  { key: 'homework' as const, label: 'Finished Homework' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-3 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                    <Checkbox 
                      id={key} 
                      checked={currentLog?.[key] || false}
                      onCheckedChange={(c) => handleToggle(key, c as boolean)}
                      className="w-6 h-6 rounded-sm border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label 
                      htmlFor={key}
                      className="text-base font-medium leading-none cursor-pointer flex-1"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes & Reflections</label>
                <Textarea 
                  placeholder="What did you learn today? What was difficult?"
                  className="min-h-[120px] resize-none"
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
