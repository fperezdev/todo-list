import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { getDB } from "@/lib/db";
import { getWeekdaysArray, getLastNDays, WEEKDAY_NAMES, toDateString } from "@/lib/utils";
import type { Task, TaskCompletion } from "@/lib/types";
import CompletionChart from "@/components/CompletionChart";
import Spinner from "@/components/Spinner";

const MONTH_NAMES: Record<number, string> = {
  0: "Ene", 1: "Feb", 2: "Mar", 3: "Abr",
  4: "May", 5: "Jun", 6: "Jul", 7: "Ago",
  8: "Sep", 9: "Oct", 10: "Nov", 11: "Dic",
};

export default function Dash() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');

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
          <p className="mt-4 text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Todo List - Dash</title>
      </Helmet>

      <h1 className="text-xl font-bold">Estadísticas</h1>

      <CompletionChart
        dailyData={dailyChartData}
        weeklyData={weeklyChartData}
        monthlyData={monthlyChartData}
        annualData={annualChartData}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
      />

      {/* Total tasks */}
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
