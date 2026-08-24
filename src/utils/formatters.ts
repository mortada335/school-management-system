import { format, parseISO } from "date-fns";

export function customFormatDate(
  date: Date | string | null | undefined,
  formatStr: string = "yyyy-MM-dd"
): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, formatStr);
  } catch {
    return String(date);
  }
}
