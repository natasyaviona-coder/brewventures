"use client";

import * as React from "react";
import type { Brew, Tasting } from "@/lib/types";
import { Stars, Scale } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/utils";
import { deleteBrew, duplicateBrew } from "@/actions/brews";
import { toast } from "sonner";

type BrewRow = Brew & { tasting: Tasting | null };

export function BrewDetail({
  brew,
  onDone,
  onEditTasting,
}: {
  brew: BrewRow;
  onDone: () => void;
  onEditTasting: (brewId: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const ratio = brew.dose > 0 ? (brew.water / brew.dose).toFixed(1) : "—";

  return (
    <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--muted)]/40 animate-slide-up">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Fact label="Method" value={brew.method} />
        <Fact label="Dose" value={`${brew.dose}g`} />
        <Fact label="Water" value={`${brew.water}g`} />
        <Fact label="Ratio" value={`1:${ratio}`} />
        {brew.grinder && <Fact label="Grinder" value={brew.grinder} />}
        {brew.grindSize && (
          <Fact
            label="Grind"
            value={brew.grindSize + (brew.grindAdjustment != null ? ` · ${brew.grindAdjustment}` : "")}
          />
        )}
        {brew.pours != null && <Fact label="Pours" value={String(brew.pours)} />}
        {brew.waterTemp != null && <Fact label="Temp" value={`${brew.waterTemp}°C`} />}
        {brew.brewTimeSec != null && (
          <Fact
            label="Brew time"
            value={`${Math.floor(brew.brewTimeSec / 60)}:${String(brew.brewTimeSec % 60).padStart(2, "0")}`}
          />
        )}
      </div>

      {brew.notes && (
        <div className="mt-3 text-sm">
          <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">Notes</div>
          <p className="whitespace-pre-wrap">{brew.notes}</p>
        </div>
      )}

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        {brew.tasting ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <TastingRow label="Bitterness" value={brew.tasting.bitterness} />
              <TastingRow label="Acidity" value={brew.tasting.acidity} />
              <TastingRow label="Sweetness" value={brew.tasting.sweetness} />
              <TastingRow label="Enjoyment" value={brew.tasting.enjoyment} />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)]">Body</span>
                <Scale value={brew.tasting.body} readOnly lowLabel="Tea" highLabel="Syrupy" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)]">Aroma</span>
                <Scale value={brew.tasting.aroma} readOnly lowLabel="Weak" highLabel="Fragrant" />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-xs text-[var(--muted-foreground)]">Aftertaste</span>
                <Scale value={brew.tasting.aftertaste} readOnly lowLabel="Short" highLabel="Long" />
              </div>
            </div>
            {brew.tasting.flavorNotes && (
              <div className="text-sm">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">Flavor</div>
                <p className="whitespace-pre-wrap">{brew.tasting.flavorNotes}</p>
              </div>
            )}
            {brew.tasting.comments && (
              <div className="text-sm">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">Comments</div>
                <p className="whitespace-pre-wrap">{brew.tasting.comments}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[var(--muted-foreground)] italic">No tasting recorded yet.</div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditTasting(brew.id)}
        >
          {brew.tasting ? "Edit tasting" : "Add tasting"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            startTransition(async () => {
              try {
                await duplicateBrew(brew.id);
                toast.success("Brew duplicated");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            })
          }
          disabled={pending}
        >
          Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className="text-[var(--destructive)]"
        >
          Delete
        </Button>
        <Button variant="secondary" size="sm" onClick={onDone}>
          Close
        </Button>
      </div>

      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            try {
              await deleteBrew(brew.id);
              toast.success("Brew deleted");
              onDone();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          });
        }}
        title="Delete this brew?"
        description={`Grams (${brew.dose}g) will be added back to the bean.`}
      />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function TastingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <Stars value={value} readOnly size={14} />
    </div>
  );
}
