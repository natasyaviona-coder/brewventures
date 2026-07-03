"use client";

import type { BeanWithBrews } from "@/lib/stats";
import { beanAverageEnjoyment } from "@/lib/stats";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function BeanCard({ bean, onClick }: { bean: BeanWithBrews; onClick: () => void }) {
  const avg = beanAverageEnjoyment(bean);
  const remaining = bean.remainingGrams;
  const total = bean.totalGrams;
  const percent = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const isEmpty = remaining <= 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-xl",
      )}
    >
      <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
        <div className="flex">
          {bean.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bean.imageUrl} alt={bean.name} className="w-24 h-full min-h-[132px] object-cover" />
          ) : (
            <div className="w-24 min-h-[132px] bg-gradient-to-br from-[var(--accent)] to-[var(--muted)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="opacity-60">
                <ellipse cx="12" cy="12" rx="6" ry="10" />
                <path d="M12 2c0 5-3 8-6 10 3 2 6 5 6 10" />
              </svg>
            </div>
          )}
          <div className="flex-1 p-4 min-w-0 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-base truncate">{bean.name}</div>
                <div className="text-xs text-[var(--muted-foreground)] truncate">
                  {[bean.roaster, bean.origin].filter(Boolean).join(" • ") || "—"}
                </div>
              </div>
              {avg !== null && (
                <div className="flex items-center gap-0.5 text-sm font-semibold flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--primary)" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{avg.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span>{bean.brews.length} brew{bean.brews.length === 1 ? "" : "s"}</span>
              <span aria-hidden>•</span>
              <span className={isEmpty ? "text-[var(--destructive)] font-medium" : ""}>
                {isEmpty ? "Empty" : `${Math.round(remaining)}g left`}
              </span>
            </div>

            <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isEmpty ? "bg-[var(--destructive)]" : "bg-[var(--primary)]",
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}
