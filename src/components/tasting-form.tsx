"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Stars, Scale } from "@/components/ui/rating";
import { upsertTasting } from "@/actions/tastings";
import type { BeanWithBrews } from "@/lib/stats";
import { formatDateTime } from "@/lib/utils";

type Ratings = {
  bitterness: number;
  acidity: number;
  sweetness: number;
  body: number;
  aroma: number;
  aftertaste: number;
  enjoyment: number;
  flavorNotes: string;
  comments: string;
};

function emptyRatings(): Ratings {
  return {
    bitterness: 3,
    acidity: 3,
    sweetness: 3,
    body: 3,
    aroma: 3,
    aftertaste: 3,
    enjoyment: 4,
    flavorNotes: "",
    comments: "",
  };
}

export function TastingForm({
  beans,
  selectedBrewId,
  onSelectBrew,
}: {
  beans: BeanWithBrews[];
  selectedBrewId: string;
  onSelectBrew: (id: string) => void;
}) {
  const brews = beans.flatMap((b) => b.brews.map((br) => ({ ...br, beanName: b.name })));
  const sortedBrews = [...brews].sort(
    (a, b) => new Date(b.brewedAt).getTime() - new Date(a.brewedAt).getTime(),
  );
  const selected = brews.find((b) => b.id === selectedBrewId);

  const [ratings, setRatings] = React.useState<Ratings>(emptyRatings());
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (selected?.tasting) {
      setRatings({
        bitterness: selected.tasting.bitterness,
        acidity: selected.tasting.acidity,
        sweetness: selected.tasting.sweetness,
        body: selected.tasting.body,
        aroma: selected.tasting.aroma,
        aftertaste: selected.tasting.aftertaste,
        enjoyment: selected.tasting.enjoyment,
        flavorNotes: selected.tasting.flavorNotes ?? "",
        comments: selected.tasting.comments ?? "",
      });
    } else {
      setRatings(emptyRatings());
    }
  }, [selectedBrewId, selected?.tasting]);

  const set = <K extends keyof Ratings>(k: K, v: Ratings[K]) =>
    setRatings((r) => ({ ...r, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBrewId) return;
    startTransition(async () => {
      try {
        await upsertTasting({ brewId: selectedBrewId, ...ratings });
        toast.success(selected?.tasting ? "Tasting updated" : "Tasting saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate a brew</CardTitle>
        <CardDescription>
          Pick a brew session and record how it tasted. Bean averages update instantly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Brew session *">
            <Select value={selectedBrewId} onChange={(e) => onSelectBrew(e.target.value)} required>
              <option value="">— Select brew —</option>
              {sortedBrews.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.beanName} · {formatDateTime(b.brewedAt)}
                  {b.tasting ? " ✓" : ""}
                </option>
              ))}
            </Select>
          </Field>

          {!selectedBrewId && (
            <div className="text-sm text-[var(--muted-foreground)] italic p-3 bg-[var(--muted)]/40 rounded-lg">
              Pick a brew to record tasting notes.
            </div>
          )}

          {selectedBrewId && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <RatingRow label="Bitterness">
                  <Stars value={ratings.bitterness} onChange={(v) => set("bitterness", v)} />
                </RatingRow>
                <RatingRow label="Acidity">
                  <Stars value={ratings.acidity} onChange={(v) => set("acidity", v)} />
                </RatingRow>
                <RatingRow label="Sweetness">
                  <Stars value={ratings.sweetness} onChange={(v) => set("sweetness", v)} />
                </RatingRow>
                <RatingRow label="Enjoyment">
                  <Stars value={ratings.enjoyment} onChange={(v) => set("enjoyment", v)} />
                </RatingRow>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Body">
                  <Scale
                    value={ratings.body}
                    onChange={(v) => set("body", v)}
                    lowLabel="Tea-like"
                    highLabel="Syrupy"
                  />
                </Field>
                <Field label="Aroma">
                  <Scale
                    value={ratings.aroma}
                    onChange={(v) => set("aroma", v)}
                    lowLabel="Weak"
                    highLabel="Fragrant"
                  />
                </Field>
                <Field label="Aftertaste">
                  <Scale
                    value={ratings.aftertaste}
                    onChange={(v) => set("aftertaste", v)}
                    lowLabel="Short"
                    highLabel="Long"
                  />
                </Field>
              </div>

              <Field label="Flavor notes">
                <Textarea
                  value={ratings.flavorNotes}
                  onChange={(e) => set("flavorNotes", e.target.value)}
                  placeholder="Bright blueberry, floral finish, cocoa on the tail"
                />
              </Field>

              <Field label="General comments">
                <Textarea
                  value={ratings.comments}
                  onChange={(e) => set("comments", e.target.value)}
                  placeholder="Might grind finer next time; extraction felt under."
                />
              </Field>

              <div className="flex justify-end">
                <Button type="submit" disabled={pending} size="lg">
                  {pending ? "Saving…" : selected?.tasting ? "Update tasting" : "Save tasting"}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function RatingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
