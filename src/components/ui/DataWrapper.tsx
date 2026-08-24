import type { ReactNode } from "react";
import { AlertCircle, SearchX } from "lucide-react";

interface DataWrapperProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  skeleton: ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  onRetry?: () => void;
  onClearFilters?: () => void;
  children: ReactNode;
  className?: string;
}

// ── Reusable empty state ───────────────────────────────────────────────────────
function EmptyState({
  message = "No data found",
  description,
  icon,
  onClearFilters,
}: {
  message?: string;
  description?: string;
  icon?: ReactNode;
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-white/50 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shadow-2xs">
        {icon ?? <SearchX className="h-7 w-7" strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">{message}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          type="button"
          className="mt-4 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 shadow-2xs transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Error state ────────────────────────────────────────────────────────────────
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-rose-100 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/15">
        <AlertCircle className="h-6 w-6 text-rose-500" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Something went wrong</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-2xs"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ── Main wrapper ───────────────────────────────────────────────────────────────
export default function DataWrapper({
  loading,
  error,
  empty,
  skeleton,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  onRetry,
  onClearFilters,
  children,
}: DataWrapperProps) {
  if (loading) return <>{skeleton}</>;
  if (error)   return <ErrorState message={error} onRetry={onRetry} />;
  if (empty) {
    return (
      <EmptyState
        message={emptyMessage}
        description={emptyDescription}
        icon={emptyIcon}
        onClearFilters={onClearFilters}
      />
    );
  }
  return <>{children}</>;
}

export { EmptyState, ErrorState };
