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

export interface YearPickerProps {
  title?: string;
  year?: string | number | null;
  setYear?: (val: string) => void;
  className?: string;
  buttonClassName?: string;
  clearClassName?: string;
  clearButtonClassName?: string;
  disabled?: boolean;
  hideIcon?: boolean;
  startYear?: number;
  endYear?: number;
}

export default function YearPicker({
  title,
  year,
  setYear,
  className,
  disabled,
  startYear = new Date().getFullYear() - 10,
  endYear = new Date().getFullYear() + 5,
}: YearPickerProps) {
  const { t } = useTranslation();

  const years: number[] = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {title && (
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(title) || title}
        </label>
      )}
      <Select
        value={year ? String(year) : ""}
        onValueChange={(val) => setYear?.(val || "")}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder={`${t("Select")} ${title ? (t(title) || title) : t("Year") || "Year"}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
