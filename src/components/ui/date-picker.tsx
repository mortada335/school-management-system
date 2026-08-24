import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  title?: string;
  date?: string | null;
  setDate?: (val: string) => void;
  className?: string;
  buttonClassName?: string;
  clearClassName?: string;
  clearButtonClassName?: string;
  isTimePicker?: boolean;
  disabled?: boolean;
  hideIcon?: boolean;
}

export default function DatePicker({
  title,
  date,
  setDate,
  className,
  disabled,
  isTimePicker,
}: DatePickerProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("space-y-1.5", className)}>
      {title && (
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(title) || title}
        </label>
      )}
      <Input
        type={isTimePicker ? "datetime-local" : "date"}
        value={date || ""}
        disabled={disabled}
        onChange={(e) => setDate?.(e.target.value)}
        className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm dark:border-white/10 dark:bg-gray-800"
      />
    </div>
  );
}
