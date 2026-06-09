import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getDB } from "@/lib/db";
import { getWeekdaysArray } from "@/lib/utils";
import WeekdayPicker from "@/components/WeekdayPicker";
import Spinner from "@/components/Spinner";
import type { Task } from "@/lib/types";

export default function EditTask() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const db = getDB();
        const row = await db.selectObject(
          "SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL",
          [id]
        ) as unknown as Task | undefined;
        if (row) {
          setTask(row);
          setTitle(row.title);
          setDescription(row.description || "");
          setIsRecurring(row.is_recurring === 1);
          setWeekdays(getWeekdaysArray(row.weekdays));
        }
      } catch {}
    })();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim() || !task) return;
    setSaving(true);
    try {
      const db = getDB();
      const now = new Date().toISOString();
      await db.exec({
        sql: `UPDATE tasks SET title = ?, description = ?, is_recurring = ?, weekdays = ?, updated_at = ? WHERE id = ?`,
        bind: [
          title.trim(),
          description.trim() || "",
          isRecurring ? 1 : 0,
          JSON.stringify(weekdays),
          now,
          task.id,
        ],
      });
      navigate("/");
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm("Estas seguro de eliminar esta tarea?")) return;
    setDeleting(true);
    try {
      const db = getDB();
      const now = new Date().toISOString();
      await db.exec({
        sql: "UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?",
        bind: [now, now, task.id],
      });
      navigate("/");
    } catch {} finally {
      setDeleting(false);
    }
  };

  if (!task) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Todo List - Editar tarea</title>
      </Helmet>

      <h1 className="text-xl font-bold">Editar tarea</h1>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="text-sm font-medium text-gray-500">Titulo *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Que tenes que hacer?"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles opcionales..."
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Tarea repetitiva</span>
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={`flex h-6 w-11 items-center rounded-full transition-colors ${
              isRecurring ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                isRecurring ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {isRecurring && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-500">Dias de la semana</label>
            <WeekdayPicker selected={weekdays} onChange={setWeekdays} />
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={!title.trim() || saving}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-full rounded-xl border border-red-300 py-3 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-500/10"
      >
        {deleting ? "Eliminando..." : "Eliminar tarea"}
      </button>
    </div>
  );
}
