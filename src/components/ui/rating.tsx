"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StarsProps = {
  value: number;
  onChange?: (v: number) => void;
  max?: number;
  size?: number;
  readOnly?: boolean;
  className?: string;
};

export function Stars({ value, onChange, max = 5, size = 20, readOnly = false, className }: StarsProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} role="radiogroup">
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1;
        const filled = n <= display;
        const star = (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "var(--primary)" : "none"}
            stroke={filled ? "var(--primary)" : "var(--muted-foreground)"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
        if (readOnly) {
          return (
            <span
              key={n}
              className="inline-flex"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-checked={value === n}
              role="radio"
            >
              {star}
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n === value ? 0 : n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            className="transition-transform hover:scale-110 active:scale-95"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-checked={value === n}
            role="radio"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

type ScaleProps = {
  value: number;
  onChange?: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  max?: number;
  readOnly?: boolean;
};

export function Scale({ value, onChange, lowLabel, highLabel, max = 5, readOnly = false }: ScaleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => {
          const n = i + 1;
          const active = n <= value;
          return (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(n === value ? 0 : n)}
              className={cn(
                "h-8 flex-1 rounded-md border border-[var(--border)] text-xs font-semibold transition-all",
                active
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                readOnly && "cursor-default",
              )}
              aria-label={`${n}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
