// ─── DeleteDialog.tsx ─────────────────────────────────────────────────────────
// Reusable confirmation dialog for destructive actions.
import { Trash2 } from "lucide-react";
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
            <Trash2 className="h-5 w-5 text-rose-500" strokeWidth={1.75} />
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
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
