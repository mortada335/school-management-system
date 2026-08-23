// ─── DataWrapper.tsx ──────────────────────────────────────────────────────────
// Handles the 4 states of any async data fetch:
//   loading → shows skeleton
//   error   → shows error message with retry
//   empty   → shows empty state
//   data    → renders children
//
// Usage:
//   <DataWrapper
//     loading={loading}
//     error={error}
//     empty={students.length === 0}
//     skeleton={<SkeletonStatCard />}
//     emptyMessage="No students enrolled yet"
//   >
//     {students.map(...)}
//   </DataWrapper>

import type { ReactNode } from "react";
import { Inbox, AlertCircle } from "lucide-react";

interface DataWrapperProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  skeleton: ReactNode;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

// ── Reusable empty state ───────────────────────────────────────────────────────
function EmptyState({
  message = "No data found",
  icon,
}: {
  message?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-600">
        {icon ?? <Inbox className="h-6 w-6" strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
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
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10">
        <AlertCircle className="h-6 w-6 text-rose-500" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Something went wrong</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-gray-200 dark:border-white/[0.08] px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
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
  emptyIcon,
  onRetry,
  children,
}: DataWrapperProps) {
  if (loading) return <>{skeleton}</>;
  if (error)   return <ErrorState message={error} onRetry={onRetry} />;
  if (empty)   return <EmptyState message={emptyMessage} icon={emptyIcon} />;
  return <>{children}</>;
}

// Re-export helpers so consumers import from one place
export { EmptyState, ErrorState };
