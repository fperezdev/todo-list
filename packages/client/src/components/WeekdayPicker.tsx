import { WEEKDAY_LABELS } from "@/lib/utils";

interface WeekdayPickerProps {
  selected: number[];
  onChange: (days: number[]) => void;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday ... 6 = Saturday

export default function WeekdayPicker({ selected, onChange }: WeekdayPickerProps) {
  const toggleDay = (day: number) => {
    if (selected.includes(day)) {
      if (selected.length <= 1) return; // at least one day must be selected
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day].sort());
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {ALL_DAYS.map((day) => {
        const isSelected = selected.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {WEEKDAY_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}
