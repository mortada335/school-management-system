/**
 * ExcelExport — Reusable button that exports an array of objects to .xlsx
 */
import * as XLSX from "xlsx";

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
      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </button>
  );
}
