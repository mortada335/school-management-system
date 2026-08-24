import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface MonthPickerProps {
  title?: string;
  month?: string | number | null;
  setMonth?: (val: string) => void;
  className?: string;
  buttonClassName?: string;
  clearClassName?: string;
  clearButtonClassName?: string;
  disabled?: boolean;
  hideIcon?: boolean;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function MonthPicker({
  title,
  month,
  setMonth,
  className,
  disabled,
}: MonthPickerProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("space-y-1.5", className)}>
      {title && (
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(title) || title}
        </label>
      )}
      <Select
        value={month ? String(month) : ""}
        onValueChange={(val) => setMonth?.(val || "")}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder={`${t("Select")} ${title ? (t(title) || title) : t("Month") || "Month"}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {t(m.label) || m.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
