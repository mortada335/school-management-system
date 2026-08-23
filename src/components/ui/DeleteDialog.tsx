// ─── DeleteDialog.tsx ─────────────────────────────────────────────────────────
// Reusable confirmation dialog for destructive actions.
// Portals directly to document.body with z-[100] so it overlays the entire viewport (sidebar + navbar included).

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

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

  // Focus the confirm/cancel button and lock body scroll when open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => confirmRef.current?.focus(), 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(t);
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-labelledby="dd-title"
    >
      {/* Full viewport Backdrop / Scrim */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-150"
        onClick={loading ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Dialog Modal Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#13131f] shadow-2xl z-10 transition-all animate-in zoom-in-95 fade-in-0 duration-150">

        {/* Icon + Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 shadow-xs">
            <Trash2 className="h-6 w-6 text-rose-500" strokeWidth={1.75} />
          </div>

          <h2
            id="dd-title"
            className="text-center text-[16px] font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>

          {description && (
            <p className="mt-2 text-center text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

        {/* Actions */}
        <div className="flex gap-2.5 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 transition-all shadow-md shadow-rose-500/25"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
