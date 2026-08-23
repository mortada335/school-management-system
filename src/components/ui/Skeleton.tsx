// ─── Skeleton.tsx ─────────────────────────────────────────────────────────────
// Shimmer placeholder components for loading states.
//
// Usage:
//   <Skeleton className="h-8 w-24" />           — any shape
//   <SkeletonText lines={2} />                   — text lines
//   <SkeletonCard className="h-32" />            — card-shaped block
//   <SkeletonStatCard />                         — stat card shape

import { type ReactNode } from "react";

// ── Base shimmer ───────────────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg",
        "bg-gray-200 dark:bg-white/[0.07]",
        className,
      ].join(" ")}
    />
  );
}

// ── Text lines ─────────────────────────────────────────────────────────────────
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 2, className = "" }: SkeletonTextProps) {
  return (
    <div className={["space-y-2", className].join(" ")}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={[
            "h-3.5",
            i === lines - 1 && lines > 1 ? "w-2/3" : "w-full",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ── Stat card skeleton ─────────────────────────────────────────────────────────
export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-24 mt-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ── Chart skeleton ─────────────────────────────────────────────────────────────
export function SkeletonChart({ height = 180 }: { height?: number }) {
  return (
    <div className="w-full animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.04]" style={{ height }} />
  );
}

// ── Table row skeleton ─────────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3.5 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ── Generic card ──────────────────────────────────────────────────────────────
interface SkeletonCardProps {
  className?: string;
  children?: ReactNode;
}

export function SkeletonCard({ className = "h-40", children }: SkeletonCardProps) {
  if (children) {
    return (
      <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] p-5 animate-pulse space-y-3">
        {children}
      </div>
    );
  }
  return (
    <div className={["rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13131f] animate-pulse", className].join(" ")} />
  );
}
