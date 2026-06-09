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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";

interface CompletionChartProps {
  dailyData: { label: string; value: number }[];
  weeklyData: { label: string; value: number }[];
  monthlyData: { label: string; value: number }[];
  annualData: { label: string; value: number }[];
  period: 'daily' | 'weekly' | 'monthly' | 'annual';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | 'annual') => void;
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

const TABS = [
  { value: 'daily' as const, label: 'Día' },
  { value: 'weekly' as const, label: 'Semana' },
  { value: 'monthly' as const, label: 'Mes' },
  { value: 'annual' as const, label: 'Año' },
];

export default function CompletionChart({
  dailyData,
  weeklyData,
  monthlyData,
  annualData,
  period,
  onPeriodChange,
  periodLabel,
  onPrev,
  onNext,
}: CompletionChartProps) {
  const { isOnline } = useOnline();

  const tooltipContentStyle = {
    backgroundColor: isOnline ? "#fff" : "#fef3c7",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  };

  const tooltipFormatter = (value: unknown) => {
    const num = typeof value === "number" ? value : Number(value ?? 0);
    if (period === 'daily') {
      return [`${num}`, "Completadas"];
    }
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
                dataKey="label"
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                interval={3}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
              <Line
                type="monotone"
                dataKey="value"
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
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
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
                dataKey="value"
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
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Period tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onPeriodChange(tab.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === tab.value
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Navigation - full width */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title="Anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {periodLabel}
        </span>
        <button
          onClick={onNext}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title="Siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {renderChart()}
      </div>
    </div>
  );
}
