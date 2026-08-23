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
        {icon ?? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M1 11.27c0-.897.23-1.775.67-2.55l1.706-3.098A3.75 3.75 0 0 1 6.738 3.5h6.524a3.75 3.75 0 0 1 3.362 2.122l1.706 3.098c.44.775.67 1.653.67 2.55V15a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3.73Zm3.748-6.197A2.25 2.25 0 0 1 6.738 5h6.524a2.25 2.25 0 0 1 2.017 1.073l1.574 2.855H3.157l1.591-2.855Zm2.252 7.41a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H7Z" clipRule="evenodd" />
          </svg>
        )}
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
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-rose-500">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
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
