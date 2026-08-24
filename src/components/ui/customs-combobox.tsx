import React from "react";
import { Combobox } from "@/components/ui/combobox";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface CustomsComboboxProps {
  item?: any;
  setItem?: (val: any) => void;
  endpoint?: string;
  queryKey?: string;
  filters?: any[];
  itemTitle?: string;
  itemValue?: string;
  placeholder?: string;
  searchQueryKey?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  clearButtonClassName?: string;
  clearClassName?: string;
  containerClassName?: string;
  hideIcon?: boolean;
  label?: string;
  required?: boolean;
  children?: React.ReactNode;
  options?: any[];
}

export default function CustomsCombobox({
  item,
  setItem,
  itemTitle = "name",
  itemValue = "id",
  placeholder,
  disabled,
  className,
  label,
  options = [],
}: CustomsComboboxProps) {
  const { t } = useTranslation();

  const formattedOptions = options.map((opt: any) =>
    typeof opt === "object" && opt !== null
      ? {
          value: String(opt[itemValue] ?? opt.value ?? ""),
          label: String(opt[itemTitle] ?? opt.label ?? ""),
          sublabel: opt.sublabel ? String(opt.sublabel) : undefined,
        }
      : { value: String(opt), label: String(opt) }
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(label) || label}
        </label>
      )}
      <Combobox
        value={typeof item === "object" && item !== null ? String(item[itemValue] ?? item.value ?? "") : String(item || "")}
        onChange={(val) => {
          setItem?.(val);
        }}
        placeholder={placeholder || `${t("Select")}...`}
        disabled={disabled}
        options={formattedOptions}
      />
    </div>
  );
}
