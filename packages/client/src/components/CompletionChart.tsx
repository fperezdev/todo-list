import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useOnline } from "@/hooks/useOnline";

interface WeeklyChartProps {
  data: { day: number; dayName: string; percentage: number }[];
}

export function WeeklyCompletionChart({ data }: WeeklyChartProps) {
  const { isOnline } = useOnline();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-medium text-gray-500">Cumplimiento semanal</h3>
      {data.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Sin datos disponibles</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dayName" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              formatter={(value) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return [`${num.toFixed(0)}%`, "Cumplimiento"];
              }}
              contentStyle={{
                backgroundColor: isOnline ? "#fff" : "#fef3c7",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

interface MonthlyChartProps {
  data: { date: string; percentage: number }[];
}

export function MonthlyCompletionChart({ data }: MonthlyChartProps) {
  const { isOnline } = useOnline();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-medium text-gray-500">Cumplimiento mensual</h3>
      {data.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Sin datos disponibles</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              tickFormatter={(v: string) => v.slice(5)} // MM-DD
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              formatter={(value) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return [`${num.toFixed(0)}%`, "Cumplimiento"];
              }}
              contentStyle={{
                backgroundColor: isOnline ? "#fff" : "#fef3c7",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="percentage"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function CompletionCharts({
  weeklyData,
  monthlyData,
}: {
  weeklyData: { day: number; dayName: string; percentage: number }[];
  monthlyData: { date: string; percentage: number }[];
}) {
  return (
    <div className="space-y-4">
      <WeeklyCompletionChart data={weeklyData} />
      <MonthlyCompletionChart data={monthlyData} />
    </div>
  );
}
