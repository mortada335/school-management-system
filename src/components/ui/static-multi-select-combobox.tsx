import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface StaticMultiSelectComboboxProps {
  selectedValues?: any[];
  setSelectedValues?: (vals: any[]) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  clearButtonClassName?: string;
  containerClassName?: string;
  label?: string;
  required?: boolean;
}

export default function StaticMultiSelectCombobox({
  selectedValues = [],
  setSelectedValues,
  options = [],
  placeholder,
  disabled,
  className,
  label,
}: StaticMultiSelectComboboxProps) {
  const { t } = useTranslation();

  const handleRemove = (val: string) => {
    setSelectedValues?.(selectedValues.filter((v) => v !== val));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(label) || label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800 min-h-[38px]">
        {selectedValues.length === 0 && (
          <span className="text-xs text-gray-400 py-1">{placeholder || `${t("Select")}...`}</span>
        )}
        {selectedValues.map((val) => {
          const opt = options.find((o) => o.value === val);
          return (
            <Badge key={val} variant="secondary" className="text-xs flex items-center gap-1">
              {opt?.label || val}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
