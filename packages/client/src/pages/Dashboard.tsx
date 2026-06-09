import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getDB } from "@/lib/db";
import { getTodayDate, getWeekdaysArray, toDateString } from "@/lib/utils";
import type { Task, TaskCompletion } from "@/lib/types";
import TaskItem from "@/components/TaskItem";
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
  const [managedOpen, setManagedOpen] = useState(false);
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
        await db.exec({
          sql: `UPDATE task_completions SET deleted_at = ?, updated_at = ? WHERE id = ?`,
          bind: [now, now, existing.id],
        });
      }

      if (existing && existing.status === "completed") {
        await loadData();
        return;
      }

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
        await db.exec({
          sql: `UPDATE task_completions SET deleted_at = ?, updated_at = ? WHERE id = ?`,
          bind: [now, now, existing.id],
        });
      }

      if (existing && existing.status === "skipped") {
        await loadData();
        return;
      }

      const id = crypto.randomUUID();
      await db.exec({
        sql: `INSERT INTO task_completions (id, task_id, completion_date, status, created_at, updated_at) VALUES (?, ?, ?, 'skipped', ?, ?)`,
        bind: [id, task.id, selectedDate, now, now],
      });
      await loadData();
    } catch {}
  }, [selectedDate, loadData, completions]);

  // Pending tasks: tasks that should appear on selected date and don't have completion yet
  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Check if task has completion on selected date - if so, it's managed, not pending
      const hasCompletion = completions.some(
        (c) => c.task_id === task.id && c.completion_date === selectedDate
      );
      if (hasCompletion) return false;

      // Task must be created on or before selected date
      const taskCreatedDate = task.created_at.split("T")[0].split(" ")[0]; // Extract YYYY-MM-DD
      if (taskCreatedDate > selectedDate) return false;

      if (task.is_recurring === 1) {
        const weekdays = getWeekdaysArray(task.weekdays);
        return weekdays.includes(selectedDayOfWeek);
      }
      
      // One-time task: only show on the exact date it was created
      return taskCreatedDate === selectedDate;
    });
  }, [tasks, completions, selectedDate, selectedDayOfWeek]);

  // Managed tasks: tasks with completion on selected date
  const managedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Task must be created on or before selected date
        const taskCreatedDate = task.created_at.split("T")[0].split(" ")[0];
        if (taskCreatedDate > selectedDate) return false;

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

  const getTaskStatus = useCallback(
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

      {/* Date navigation - full width with arrows at extremes */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title="Día anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{dateLabel}</h1>
          {!isViewingToday && (
            <button
              onClick={() => setSelectedDate(today)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
            >
              Hoy
            </button>
          )}
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title="Día siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Pending tasks */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">
            Pendientes ({pendingTasks.length})
          </h2>
          <Link
            to="/add"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-lg font-medium text-white hover:bg-indigo-700"
            title="Nueva tarea"
          >
            +
          </Link>
        </div>
        {pendingTasks.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-400">No hay tareas pendientes</p>
            <Link
              to="/add"
              className="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Crear una nueva tarea
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => {
              const status = getTaskStatus(task.id);
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
            <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-800">
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

      <div className="h-20" />
    </div>
  );
}
