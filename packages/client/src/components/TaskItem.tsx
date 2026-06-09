import { useNavigate } from "react-router-dom";
import { CheckCircle, Pencil, SkipForward } from "lucide-react";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  isCompletedToday: boolean;
  isSkippedToday: boolean;
  onComplete: (task: Task) => void;
  onSkip: (task: Task) => void;
}

export default function TaskItem({ task, isCompletedToday, isSkippedToday, onComplete, onSkip }: TaskItemProps) {
  const navigate = useNavigate();
  const isDone = isCompletedToday || isSkippedToday;

  return (
    <div
      className={`rounded-xl border bg-white p-3 transition-opacity dark:bg-gray-900 ${
        isDone
          ? "border-green-200 opacity-60 dark:border-green-900"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium ${isDone ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{task.description}</p>
          )}
          {task.is_recurring === 1 && (
            <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              Repetitiva
            </span>
          )}
          {isCompletedToday && (
            <span className="mt-1 ml-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-500/10 dark:text-green-400">
              Completada
            </span>
          )}
          {isSkippedToday && (
            <span className="mt-1 ml-1 inline-block rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
              Omitida
            </span>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => navigate(`/edit/${task.id}`)}
            className="rounded-lg bg-gray-100 p-1.5 text-gray-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600 dark:bg-gray-800 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400"
            title="Editar tarea"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onComplete(task)}
            className={`rounded-lg p-1.5 transition-colors ${
              isCompletedToday
                ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600 dark:bg-gray-800 dark:hover:bg-green-500/20 dark:hover:text-green-400"
            }`}
            title={isCompletedToday ? "Desmarcar completada" : "Marcar como completada"}
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => onSkip(task)}
            className={`rounded-lg p-1.5 transition-colors ${
              isSkippedToday
                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400"
                : "bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600 dark:bg-gray-800 dark:hover:bg-yellow-500/20 dark:hover:text-yellow-400"
            }`}
            title={isSkippedToday ? "Desmarcar omitida" : "Omitir hoy"}
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
