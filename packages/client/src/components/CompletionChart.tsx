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

interface CompletionChartProps {
  dailyData: { date: string; percentage: number }[];
  weeklyData: { day: number; dayName: string; percentage: number }[];
  monthlyData: { label: string; percentage: number }[];
  annualData: { label: string; percentage: number }[];
  period: 'daily' | 'weekly' | 'monthly' | 'annual';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | 'annual') => void;
}

export default function CompletionChart({
  dailyData,
  weeklyData,
  monthlyData,
  annualData,
  period,
  onPeriodChange,
}: CompletionChartProps) {
  const { isOnline } = useOnline();

  const tooltipContentStyle = {
    backgroundColor: isOnline ? "#fff" : "#fef3c7",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  };

  const tooltipFormatter = (value: unknown) => {
    const num = typeof value === "number" ? value : Number(value ?? 0);
    return [`${num.toFixed(0)}%`, "Cumplimiento"];
  };

  const isEmpty = (() => {
    switch (period) {
      case 'daily': return dailyData.length === 0;
      case 'weekly': return weeklyData.length === 0;
      case 'monthly': return monthlyData.length === 0;
      case 'annual': return annualData.length === 0;
    }
  })();

  const renderChart = () => {
    if (isEmpty) {
      return <p className="text-center text-sm text-gray-400 py-8">Sin datos disponibles</p>;
    }

    switch (period) {
      case 'daily':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'weekly':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dayName" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
              <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'annual':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
              <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">Cumplimiento</h3>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as CompletionChartProps['period'])}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
        >
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
          <option value="annual">Anual</option>
        </select>
      </div>
      {renderChart()}
    </div>
  );
}
