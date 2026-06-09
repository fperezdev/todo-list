import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getDB } from "@/lib/db";
import { getTodayDate, getWeekdaysArray, getLastNDays, WEEKDAY_NAMES, toDateString } from "@/lib/utils";
import type { Task, TaskCompletion } from "@/lib/types";
import TaskItem from "@/components/TaskItem";
import CompletionChart from "@/components/CompletionChart";
import Spinner from "@/components/Spinner";

const MONTH_NAMES: Record<number, string> = {
  0: "Ene", 1: "Feb", 2: "Mar", 3: "Abr",
  4: "May", 5: "Jun", 6: "Jul", 7: "Ago",
  8: "Sep", 9: "Oct", 10: "Nov", 11: "Dic",
};

const WEEKDAY_FULL: Record<number, string> = {
  0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
  4: "Jueves", 5: "Viernes", 6: "Sábado",
};

function formatDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "Hoy";
  
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date(todayStr + "T12:00:00");
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";
  
  const weekday = WEEKDAY_FULL[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${weekday} ${day} ${month}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T12:00:00");
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');
  const [managedOpen, setManagedOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const today = getTodayDate();
  const selectedDayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const isViewingToday = selectedDate === today;
  const dateLabel = formatDateLabel(selectedDate, today);

  const loadData = useCallback(async () => {
    try {
      const db = getDB();
      const [taskRows, compRows] = await Promise.all([
        db.selectObjects(
          "SELECT * FROM tasks WHERE deleted_at IS NULL ORDER BY created_at DESC"
        ) as unknown as Promise<Task[]>,
        db.selectObjects(
          "SELECT * FROM task_completions WHERE deleted_at IS NULL ORDER BY completion_date DESC"
        ) as unknown as Promise<TaskCompletion[]>,
      ]);
      setTasks(taskRows);
      setCompletions(compRows);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComplete = useCallback(async (task: Task) => {
    try {
      const db = getDB();
      const now = new Date().toISOString();

      const existing = completions.find(
        (c) => c.task_id === task.id && c.completion_date === selectedDate
      );

      if (existing) {
        // Soft-delete existing completion for selected date
        await db.exec({
          sql: `UPDATE task_completions SET deleted_at = ?, updated_at = ? WHERE id = ?`,
          bind: [now, now, existing.id],
        });
      }

      // If toggling off (was already completed), we're done
      if (existing && existing.status === "completed") {
        await loadData();
        return;
      }

      // Insert new completed record (fresh or switching from skipped)
      const id = crypto.randomUUID();
      await db.exec({
        sql: `INSERT INTO task_completions (id, task_id, completion_date, status, created_at, updated_at) VALUES (?, ?, ?, 'completed', ?, ?)`,
        bind: [id, task.id, selectedDate, now, now],
      });
      await loadData();
    } catch {}
  }, [selectedDate, loadData, completions]);

  const handleSkip = useCallback(async (task: Task) => {
    try {
      const db = getDB();
      const now = new Date().toISOString();

      const existing = completions.find(
        (c) => c.task_id === task.id && c.completion_date === selectedDate
      );

      if (existing) {
        // Soft-delete existing completion for selected date
        await db.exec({
          sql: `UPDATE task_completions SET deleted_at = ?, updated_at = ? WHERE id = ?`,
          bind: [now, now, existing.id],
        });
      }

      // If toggling off (was already skipped), we're done
      if (existing && existing.status === "skipped") {
        await loadData();
        return;
      }

      // Insert new skipped record (fresh or switching from completed)
      const id = crypto.randomUUID();
      await db.exec({
        sql: `INSERT INTO task_completions (id, task_id, completion_date, status, created_at, updated_at) VALUES (?, ?, ?, 'skipped', ?, ?)`,
        bind: [id, task.id, selectedDate, now, now],
      });
      await loadData();
    } catch {}
  }, [selectedDate, loadData, completions]);

  // Filter tasks for selected date
  const todayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.is_recurring === 1) {
        const weekdays = getWeekdaysArray(task.weekdays);
        return weekdays.includes(selectedDayOfWeek);
      }
      // One-time task: show if not completed/skipped on selected date
      const dateCompletion = completions.find(
        (c) => c.task_id === task.id && c.completion_date === selectedDate
      );
      if (dateCompletion) return false; // already completed or skipped
      return true;
    });
  }, [tasks, completions, selectedDate, selectedDayOfWeek]);

  // Tasks completed or skipped on selected date
  const managedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const comp = completions.find(
          (c) => c.task_id === task.id && c.completion_date === selectedDate
        );
        return comp !== undefined;
      })
      .map((task) => {
        const comp = completions.find(
          (c) => c.task_id === task.id && c.completion_date === selectedDate
        )!;
        return { task, status: comp.status };
      });
  }, [tasks, completions, selectedDate]);

  // Check if a task is completed/skipped on selected date
  const getTaskTodayStatus = useCallback(
    (taskId: string): { completed: boolean; skipped: boolean } => {
      const comp = completions.find(
        (c) => c.task_id === taskId && c.completion_date === selectedDate
      );
      if (!comp) return { completed: false, skipped: false };
      return {
        completed: comp.status === "completed",
        skipped: comp.status === "skipped",
      };
    },
    [completions, selectedDate]
  );

  // Weekly chart data
  const weeklyChartData = useMemo(() => {
    const days = [0, 1, 2, 3, 4, 5, 6];
    return days.map((day) => {
      const dayTasks = tasks.filter((task) => {
        if (task.is_recurring === 1) {
          const weekdays = getWeekdaysArray(task.weekdays);
          return weekdays.includes(day);
        }
        return true;
      });
      const totalTasks = dayTasks.length;
      if (totalTasks === 0) return { day, dayName: WEEKDAY_NAMES[day], percentage: 0 };

      // Count completions for this weekday over all time
      let completedCount = 0;
      for (const task of dayTasks) {
        const taskCompletions = completions.filter(
          (c) => c.task_id === task.id && c.status === "completed"
        );
        if (taskCompletions.length > 0) completedCount++;
      }
      const percentage = (completedCount / totalTasks) * 100;
      return { day, dayName: WEEKDAY_NAMES[day], percentage };
    });
  }, [tasks, completions]);

  // Daily chart data (last 30 days)
  const dailyChartData = useMemo(() => {
    const last30 = getLastNDays(30);
    return last30.map((date) => {
      const d = new Date(date + "T12:00:00");
      const dayOfWeek = d.getDay();

      // Count tasks visible on this date
      const visibleTasks = tasks.filter((task) => {
        if (task.deleted_at) return false;
        if (task.created_at > date) return false;
        if (task.is_recurring === 1) {
          const weekdays = getWeekdaysArray(task.weekdays);
          return weekdays.includes(dayOfWeek);
        }
        return true;
      });

      const totalTasks = visibleTasks.length;
      if (totalTasks === 0) return { date, percentage: 0 };

      // Count completions for this date
      const dateCompletions = completions.filter(
        (c) => c.completion_date === date && c.status === "completed"
      );
      const completedTaskIds = new Set(dateCompletions.map((c) => c.task_id));

      let completedCount = 0;
      for (const task of visibleTasks) {
        if (completedTaskIds.has(task.id)) completedCount++;
      }

      const percentage = (completedCount / totalTasks) * 100;
      return { date, percentage };
    });
  }, [tasks, completions]);

  // Monthly chart data: group daily data into weeks
  const monthlyChartData = useMemo(() => {
    if (dailyChartData.length === 0) return [];
    const groups: { label: string; percentage: number }[] = [];
    for (let i = 0; i < dailyChartData.length; i += 7) {
      const chunk = dailyChartData.slice(i, i + 7);
      const avg = chunk.reduce((sum, d) => sum + d.percentage, 0) / chunk.length;
      groups.push({
        label: `Sem ${groups.length + 1}`,
        percentage: Math.round(avg * 10) / 10,
      });
    }
    return groups;
  }, [dailyChartData]);

  // Annual chart data: last 12 months
  const annualChartData = useMemo(() => {
    const result: { label: string; percentage: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const todayStr = toDateString(now);

      const dailyPercentages: number[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Don't process future dates
        if (date > todayStr) break;

        const d = new Date(year, month, day, 12, 0, 0);
        const dayOfWeek = d.getDay();

        const visibleTasks = tasks.filter((task) => {
          if (task.deleted_at) return false;
          if (task.created_at > date) return false;
          if (task.is_recurring === 1) {
            const weekdays = getWeekdaysArray(task.weekdays);
            return weekdays.includes(dayOfWeek);
          }
          return true;
        });

        const totalTasks = visibleTasks.length;
        if (totalTasks === 0) continue;

        const dateCompletions = completions.filter(
          (c) => c.completion_date === date && c.status === "completed"
        );
        const completedTaskIds = new Set(dateCompletions.map((c) => c.task_id));

        let completedCount = 0;
        for (const task of visibleTasks) {
          if (completedTaskIds.has(task.id)) completedCount++;
        }

        dailyPercentages.push((completedCount / totalTasks) * 100);
      }

      const avg = dailyPercentages.length > 0
        ? dailyPercentages.reduce((s, p) => s + p, 0) / dailyPercentages.length
        : 0;

      result.push({
        label: MONTH_NAMES[month],
        percentage: Math.round(avg * 10) / 10,
      });
    }

    return result;
  }, [tasks, completions]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-400">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Todo List - Inicio</title>
      </Helmet>

      {/* Pending tasks accordion */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setPendingOpen(!pendingOpen)}
            className="flex items-center gap-2"
          >
            <span className="text-lg font-bold">{dateLabel}</span>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform ${pendingOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="Día anterior"
            >
              <ChevronLeft size={18} />
            </button>
            {!isViewingToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              >
                Hoy
              </button>
            )}
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="Día siguiente"
            >
              <ChevronRight size={18} />
            </button>
            <Link
              to="/add"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Nueva
            </Link>
          </div>
        </div>

        {pendingOpen && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-800">
            {todayTasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400">No hay tareas para este día</p>
                <Link
                  to="/add"
                  className="mt-3 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Crear una nueva tarea
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task) => {
                  const status = getTaskTodayStatus(task.id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isCompletedToday={status.completed}
                      isSkippedToday={status.skipped}
                      onComplete={handleComplete}
                      onSkip={handleSkip}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Managed tasks accordion */}
      {managedTasks.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setManagedOpen(!managedOpen)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tareas gestionadas ({managedTasks.length})
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform ${managedOpen ? "rotate-180" : ""}`}
            />
          </button>
          {managedOpen && (
            <div className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-800">
              {managedTasks.map(({ task, status }) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompletedToday={status === "completed"}
                  isSkippedToday={status === "skipped"}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <CompletionChart
        dailyData={dailyChartData}
        weeklyData={weeklyChartData}
        monthlyData={monthlyChartData}
        annualData={annualChartData}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
      />

      {/* All tasks quick link */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-500">
            {tasks.length} tarea{tasks.length !== 1 ? "s" : ""} en total
          </p>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
