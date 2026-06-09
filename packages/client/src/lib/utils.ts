export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange(daysBack: number): { start: string; end: string } {
  const start = new Date();
  start.setDate(start.getDate() - daysBack);

  const end = new Date();

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

export function getTodayDate(): string {
  return toDateString(new Date());
}

export function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0 = Sunday, ..., 6 = Saturday
}

export function getWeekdaysArray(weekdaysJson?: string | null): number[] {
  if (!weekdaysJson) return [0, 1, 2, 3, 4, 5, 6];
  try {
    const parsed = JSON.parse(weekdaysJson);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [0, 1, 2, 3, 4, 5, 6];
  } catch {
    return [0, 1, 2, 3, 4, 5, 6];
  }
}

export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateString(d));
  }
  return days;
}

export const WEEKDAY_LABELS: Record<number, string> = {
  0: "D",
  1: "L",
  2: "M",
  3: "M",
  4: "J",
  5: "V",
  6: "S",
};

export const WEEKDAY_NAMES: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mie",
  4: "Jue",
  5: "Vie",
  6: "Sab",
};

export const WEEKDAY_FULL: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
};
