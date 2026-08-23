/**
 * ExcelExport — Reusable button that exports an array of objects to .xlsx
 */
import * as XLSX from "xlsx";
import { Download } from "lucide-react";


interface ExcelExportProps {
  data: Record<string, unknown>[];
  filename?: string;
  label?: string;
  className?: string;
}

export default function ExcelExport({
  data,
  filename = "export",
  label = "Export Excel",
  className = "",
}: ExcelExportProps) {
  const handleExport = () => {
    if (!data.length) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data.length}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-40 shadow-2xs ${className}`}
    >
      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
