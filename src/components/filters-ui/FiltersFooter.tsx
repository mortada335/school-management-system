import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { RotateCcw, Check } from "lucide-react";

export interface FiltersFooterProps {
  isLoading?: boolean;
  onApply?: () => void;
  onReset?: () => void;
}

export default function FiltersFooter({
  isLoading,
  onApply,
  onReset,
}: FiltersFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
      {onReset && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isLoading}
          className="text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("Reset") || "Reset"}
        </Button>
      )}
      {onApply && (
        <Button
          size="sm"
          onClick={onApply}
          disabled={isLoading}
          className="text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          <Check className="h-3.5 w-3.5" />
          {t("Apply") || "Apply"}
        </Button>
      )}
    </div>
  );
}
