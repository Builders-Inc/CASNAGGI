import React, { useEffect, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Small modal for destructive confirmations.
 *
 * Hand-rolled rather than pulled from the unused shadcn set so the admin area
 * keeps the same plain-Tailwind idiom as the rest of the app, but it still does
 * the things a modal has to do: Escape closes it, focus moves in on open and
 * returns to the trigger on close, and the backdrop is inert to the keyboard.
 */
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
  children,
}) => {
  const confirmRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    confirmRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      data-testid="confirm-dialog"
    >
      <button
        type="button"
        className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => !busy && onCancel()}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-brand-rule bg-brand-bg p-7">
        <AlertTriangle className="h-7 w-7 text-brand-terracotta" />
        <h2 id="confirm-title" className="font-display text-2xl font-medium mt-4">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-sm text-brand-ink/70 leading-relaxed">{description}</p>
        )}
        {children}
        <div className="mt-7 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-ghost disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn-primary disabled:opacity-60"
            data-testid="confirm-dialog-confirm"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
