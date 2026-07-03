"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
};

export function Modal({ open, onClose, title, description, children, maxWidth = "max-w-2xl" }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-10 w-full bg-[var(--card)] text-[var(--card-foreground)] rounded-2xl border border-[var(--border)] shadow-2xl animate-scale-in",
          maxWidth,
        )}
      >
        <div className="flex items-start justify-between p-6 pb-3 border-b border-[var(--border)]">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
            {description && (
              <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[var(--muted)] transition-colors -mt-1 -mr-1"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 pt-4 max-h-[calc(100dvh-10rem)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  width?: string;
};

export function Drawer({ open, onClose, title, description, children, width = "max-w-2xl" }: DrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed right-0 top-0 h-full w-full bg-[var(--card)] text-[var(--card-foreground)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-slide-in",
          width,
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 pb-4 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur">
          <div className="flex flex-col gap-1 min-w-0 pr-4">
            {title && <h2 className="text-xl font-semibold tracking-tight truncate">{title}</h2>}
            {description && (
              <p className="text-sm text-[var(--muted-foreground)] truncate">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[var(--muted)] transition-colors -mt-1 -mr-1 flex-shrink-0"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  onCancel,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Delete",
  destructive = true,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  destructive?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description} maxWidth="max-w-sm">
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="h-9 px-4 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            "h-9 px-4 rounded-lg text-sm font-medium transition-opacity hover:opacity-90",
            destructive
              ? "bg-[var(--destructive)] text-[var(--destructive-foreground)]"
              : "bg-[var(--primary)] text-[var(--primary-foreground)]",
          )}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
