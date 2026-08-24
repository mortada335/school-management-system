import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface DebouncedTextInputProps {
  title?: string;
  value?: string | null;
  onChange?: (val: string) => void;
  className?: string;
  placeholder?: string;
  delay?: number;
}

export function DebouncedTextInput({
  title,
  value = "",
  onChange,
  className,
  placeholder,
  delay = 500,
}: DebouncedTextInputProps) {
  const { t } = useTranslation();
  const [innerVal, setInnerVal] = useState(value || "");
  const debounced = useDebounce(innerVal, delay);

  useEffect(() => {
    setInnerVal(value || "");
  }, [value]);

  useEffect(() => {
    if (onChange && debounced !== value) {
      onChange(debounced);
    }
  }, [debounced]);

  return (
    <div className={cn("space-y-1.5", className)}>
      {title && (
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(title) || title}
        </label>
      )}
      <Input
        value={innerVal}
        onChange={(e) => setInnerVal(e.target.value)}
        placeholder={placeholder || `${t("Search")} ${t(title || "")}`}
        className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm dark:border-white/10 dark:bg-gray-800"
      />
    </div>
  );
}

export default DebouncedTextInput;
