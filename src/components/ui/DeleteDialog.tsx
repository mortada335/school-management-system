// ─── DeleteDialog.tsx ─────────────────────────────────────────────────────────
// Reusable confirmation dialog for destructive actions.
//
// Usage:
//   <DeleteDialog
//     open={open}
//     title="Delete Student"
//     description="This will permanently remove Ahmed Al-Rashid and all their records."
//     onConfirm={handleDelete}
//     onCancel={() => setOpen(false)}
//     loading={deleting}
//   />

import { useEffect, useRef } from "react";

interface DeleteDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when the dialog opens (safer default)
  useEffect(() => {
    if (open) {
      // small delay so the dialog is painted first
      const t = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="dd-title"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#13131f] shadow-2xl">

        {/* Icon + header */}
        <div className="px-6 pt-6 pb-4">
          {/* Trash icon circle */}
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-rose-500">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </div>

          <h2
            id="dd-title"
            className="text-center text-[15px] font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>

          {description && (
            <p className="mt-1.5 text-center text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-white/[0.05]" />

        {/* Actions */}
        <div className="flex gap-2.5 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 transition-colors shadow-sm shadow-rose-500/30"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
