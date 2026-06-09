import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { getDB } from "@/lib/db";
import { getWeekdaysArray, WEEKDAY_NAMES, toDateString, getTodayDate } from "@/lib/utils";
import type { Task, TaskCompletion } from "@/lib/types";
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

const WEEKDAY_SHORT = WEEKDAY_NAMES;

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

function calculateDayCompliance(
  dateStr: string,
  tasks: Task[],
  completions: TaskCompletion[],
): number {
  const d = new Date(dateStr + "T12:00:00");
  const dayOfWeek = d.getDay();

  const visibleTasks = tasks.filter((task) => {
    if (task.deleted_at) return false;
    const taskCreatedDate = task.created_at.split("T")[0];
    if (taskCreatedDate > dateStr) return false;
    if (task.is_recurring === 1) {
      const weekdays = getWeekdaysArray(task.weekdays);
      return weekdays.includes(dayOfWeek);
    }
    return taskCreatedDate === dateStr;
  });

  if (visibleTasks.length === 0) return 0;

  const completedCount = visibleTasks.filter((task) =>
    completions.some(
      (c) => c.task_id === task.id && c.completion_date === dateStr && c.status === "completed",
    ),
  ).length;

  return (completedCount / visibleTasks.length) * 100;
}

export default function Dash() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');
  const [chartDate, setChartDate] = useState(new Date());

  const today = getTodayDate();

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

  // Daily chart data: hours of the day
  const dailyChartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    const dateStr = toDateString(chartDate);

    completions
      .filter((c) => c.completion_date === dateStr && c.status === "completed")
      .forEach((c) => {
        const hour = new Date(c.created_at).getHours();
        hours[hour].count++;
      });

    return hours.map((h) => ({ label: `${h.hour}:00`, value: h.count }));
  }, [completions, chartDate]);

  // Weekly chart data: days of the week (Mon-Sun)
  const weeklyChartData = useMemo(() => {
    const dayOfWeek = chartDate.getDay();
    const monday = new Date(chartDate);
    monday.setDate(chartDate.getDate() - ((dayOfWeek + 6) % 7));

    const days: { label: string; value: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toDateString(d);
      const percentage = calculateDayCompliance(dateStr, tasks, completions);
      days.push({ label: WEEKDAY_SHORT[d.getDay()], value: percentage });
    }
    return days;
  }, [chartDate, tasks, completions]);

  // Monthly chart data: weeks of the month
  const monthlyChartData = useMemo(() => {
    const year = chartDate.getFullYear();
    const month = chartDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Group days into weeks (Mon-Sun)
    const weeks: string[][] = [];
    let currentWeek: string[] = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      currentWeek.push(toDateString(d));
      if (d.getDay() === 0 || d.getTime() === lastDay.getTime()) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    return weeks.map((weekDays, i) => {
      const avgCompliance =
        weekDays.reduce((sum, day) => sum + calculateDayCompliance(day, tasks, completions), 0) /
        weekDays.length;
      return { label: `Sem ${i + 1}`, value: avgCompliance };
    });
  }, [chartDate, tasks, completions]);

  // Annual chart data: months of the year
  const annualChartData = useMemo(() => {
    const year = chartDate.getFullYear();
    const months: { label: string; value: number }[] = [];

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1);
      const lastDay = new Date(year, m + 1, 0);

      let totalCompliance = 0;
      let dayCount = 0;

      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateStr = toDateString(d);
        if (dateStr > today) break;
        totalCompliance += calculateDayCompliance(dateStr, tasks, completions);
        dayCount++;
      }

      const avgCompliance = dayCount > 0 ? totalCompliance / dayCount : 0;
      months.push({ label: MONTH_NAMES[m], value: avgCompliance });
    }

    return months;
  }, [chartDate, tasks, completions, today]);

  // Period label for navigation header
  const chartPeriodLabel = useMemo(() => {
    switch (chartPeriod) {
      case 'daily':
        return formatDateLabel(toDateString(chartDate), today);
      case 'weekly': {
        const dayOfWeek = chartDate.getDay();
        const monday = new Date(chartDate);
        monday.setDate(chartDate.getDate() - ((dayOfWeek + 6) % 7));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return `Semana ${monday.getDate()}-${sunday.getDate()} ${MONTH_NAMES[sunday.getMonth()]}`;
      }
      case 'monthly':
        return `${MONTH_NAMES[chartDate.getMonth()]} ${chartDate.getFullYear()}`;
      case 'annual':
        return `${chartDate.getFullYear()}`;
    }
  }, [chartDate, chartPeriod, today]);

  // Stats for the current period
  const stats = useMemo(() => {
    // Total tasks: all tasks that exist up to today
    const todayDate = new Date(today + "T12:00:00");
    const totalTasks = tasks.filter((task) => {
      const taskCreatedDate = task.created_at.split("T")[0];
      return taskCreatedDate <= today;
    }).length;

    // Get date range for the period
    let startDate: Date;
    let endDate: Date;

    switch (chartPeriod) {
      case 'daily': {
        startDate = new Date(chartDate);
        endDate = new Date(chartDate);
        break;
      }
      case 'weekly': {
        const dayOfWeek = chartDate.getDay();
        const monday = new Date(chartDate);
        monday.setDate(chartDate.getDate() - ((dayOfWeek + 6) % 7));
        startDate = monday;
        endDate = new Date(monday);
        endDate.setDate(monday.getDate() + 6);
        break;
      }
      case 'monthly': {
        const year = chartDate.getFullYear();
        const month = chartDate.getMonth();
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        break;
      }
      case 'annual': {
        const year = chartDate.getFullYear();
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      }
    }

    // Don't count future days
    if (endDate > todayDate) {
      endDate = todayDate;
    }

    const startDateStr = toDateString(startDate);
    const endDateStr = toDateString(endDate);

    // Completed tasks: unique tasks that have at least one 'completed' completion in the period
    const completedTaskIds = new Set<string>();
    completions.forEach((c) => {
      if (c.status === "completed" && c.completion_date >= startDateStr && c.completion_date <= endDateStr) {
        completedTaskIds.add(c.task_id);
      }
    });

    const completedTasks = completedTaskIds.size;
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    return { totalTasks, completedTasks, completionPercentage };
  }, [chartPeriod, chartDate, tasks, completions, today]);

  // Navigation handlers
  const handleChartPrev = () => {
    const d = new Date(chartDate);
    switch (chartPeriod) {
      case 'daily':
        d.setDate(d.getDate() - 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() - 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() - 1);
        break;
      case 'annual':
        d.setFullYear(d.getFullYear() - 1);
        break;
    }
    setChartDate(d);
  };

  const handleChartNext = () => {
    const d = new Date(chartDate);
    switch (chartPeriod) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'annual':
        d.setFullYear(d.getFullYear() + 1);
        break;
    }
    setChartDate(d);
  };

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

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTasks}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</p>
          <p className="text-xs text-gray-500">Completadas</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.completionPercentage}%</p>
          <p className="text-xs text-gray-500">Cumplimiento</p>
        </div>
      </div>

      <CompletionChart
        dailyData={dailyChartData}
        weeklyData={weeklyChartData}
        monthlyData={monthlyChartData}
        annualData={annualChartData}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        periodLabel={chartPeriodLabel}
        onPrev={handleChartPrev}
        onNext={handleChartNext}
      />

      <div className="h-20" />
    </div>
  );
}
