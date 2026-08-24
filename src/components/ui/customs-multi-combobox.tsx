import React from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface CustomsMultiComboboxProps {
  items?: any[];
  setItems?: (vals: any[]) => void;
  endpoint?: string;
  queryKey?: string;
  filters?: any[];
  itemTitle?: string;
  itemValue?: string;
  placeholder?: string;
  searchQueryKey?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
  children?: React.ReactNode;
  options?: { value: string; label: string }[];
}

export default function CustomsMultiCombobox({
  items = [],
  setItems,
  itemTitle = "name",
  itemValue = "id",
  placeholder,
  disabled,
  className,
  label,
}: CustomsMultiComboboxProps) {
  const { t } = useTranslation();

  const handleToggle = (opt: any) => {
    const val = opt[itemValue] ?? opt.value;
    const exists = items.some((i) => (typeof i === "object" ? (i[itemValue] ?? i.value) === val : i === val));
    if (exists) {
      setItems?.(items.filter((i) => (typeof i === "object" ? (i[itemValue] ?? i.value) !== val : i !== val)));
    } else {
      setItems?.([...items, opt]);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(label) || label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800 min-h-[38px]">
        {items.length === 0 && (
          <span className="text-xs text-gray-400 py-1">{placeholder || `${t("Select")}...`}</span>
        )}
        {items.map((item, idx) => {
          const val = typeof item === "object" ? item[itemValue] ?? item.value : item;
          const lbl = typeof item === "object" ? item[itemTitle] ?? item.label ?? val : val;
          return (
            <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1">
              {lbl}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
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
