import { useNavigate } from "react-router-dom";
import { CheckCircle, Repeat } from "lucide-react";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  isCompleted: boolean;
  onComplete: (task: Task) => void;
}

export default function TaskItem({ task, isCompleted, onComplete }: TaskItemProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`rounded-xl border bg-white px-3 py-2 transition-opacity dark:bg-gray-900 ${
        isCompleted
          ? "border-green-200 opacity-60 dark:border-green-900"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            onClick={() => navigate(`/edit/${task.id}`)}
            className={`text-sm font-medium text-left truncate ${isCompleted ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {task.title}
          </button>
          {task.is_recurring === 1 && (
            <Repeat size={14} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
          )}
          {isCompleted && (
            <CheckCircle size={14} className="text-green-500 dark:text-green-400 shrink-0" />
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onComplete(task)}
            className={`rounded-lg p-2 transition-colors ${
              isCompleted
                ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600 dark:bg-gray-800 dark:hover:bg-green-500/20 dark:hover:text-green-400"
            }`}
            title={isCompleted ? "Desmarcar completada" : "Marcar como completada"}
          >
            <CheckCircle size={18} />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="mt-1 text-xs text-gray-400 line-clamp-2 px-1">{task.description}</p>
      )}
    </div>
  );
}
