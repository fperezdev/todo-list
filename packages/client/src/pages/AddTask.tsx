import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getDB } from "@/lib/db";
import WeekdayPicker from "@/components/WeekdayPicker";

export default function AddTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const db = getDB();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.exec({
        sql: `INSERT INTO tasks (id, title, description, is_recurring, weekdays, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        bind: [
          id,
          title.trim(),
          description.trim() || "",
          isRecurring ? 1 : 0,
          JSON.stringify(weekdays),
          now,
          now,
        ],
      });
      navigate("/");
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Todo List - Nueva tarea</title>
      </Helmet>

      <h1 className="text-xl font-bold">Nueva tarea</h1>

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
        {saving ? "Guardando..." : "Guardar tarea"}
      </button>
    </div>
  );
}
