"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createBrew } from "@/actions/brews";
import type { Bean } from "@/lib/types";
import { formatDateTimeLocalInput } from "@/lib/utils";

type BrewInput = {
  beanId: string;
  brewedAt: string;
  method: string;
  dose: string;
  water: string;
  grinder: string;
  grindSize: string;
  grindAdjustment: string;
  pours: string;
  waterTemp: string;
  brewTimeMin: string;
  brewTimeSec: string;
  notes: string;
};

function initial(defaultBeanId?: string): BrewInput {
  return {
    beanId: defaultBeanId ?? "",
    brewedAt: formatDateTimeLocalInput(new Date()),
    method: "V60",
    dose: "15",
    water: "250",
    grinder: "",
    grindSize: "Medium",
    grindAdjustment: "",
    pours: "3",
    waterTemp: "93",
    brewTimeMin: "3",
    brewTimeSec: "0",
    notes: "",
  };
}

const AUTOSAVE_KEY = "brewventures:brew-draft";

export function BrewForm({ beans }: { beans: Bean[] }) {
  const [form, setForm] = React.useState<BrewInput>(initial());
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = window.localStorage.getItem(AUTOSAVE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setForm((prev) => ({ ...prev, ...parsed, brewedAt: formatDateTimeLocalInput(new Date()) }));
      } catch {}
    }
  }, []);

  React.useEffect(() => {
    const id = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
      }
    }, 400);
    return () => clearTimeout(id);
  }, [form]);

  const set = <K extends keyof BrewInput>(k: K, v: BrewInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const dose = Number(form.dose);
  const water = Number(form.water);
  const ratio = dose > 0 ? (water / dose).toFixed(1) : "—";

  const canSubmit = form.beanId && dose > 0 && water > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const brewTimeSec = (Number(form.brewTimeMin) || 0) * 60 + (Number(form.brewTimeSec) || 0);
    startTransition(async () => {
      try {
        await createBrew({
          beanId: form.beanId,
          brewedAt: form.brewedAt,
          method: form.method,
          dose: form.dose,
          water: form.water,
          grinder: form.grinder,
          grindSize: form.grindSize,
          grindAdjustment: form.grindAdjustment || null,
          pours: form.pours || null,
          waterTemp: form.waterTemp || null,
          brewTimeSec: brewTimeSec || null,
          notes: form.notes,
        });
        toast.success("Brew logged");
        window.localStorage.removeItem(AUTOSAVE_KEY);
        setForm(initial(form.beanId));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save brew");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a brew</CardTitle>
        <CardDescription>
          Quick entry. Fields autosave to your browser until you submit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Coffee bean *">
              <Select value={form.beanId} onChange={(e) => set("beanId", e.target.value)} required>
                <option value="">— Select bean —</option>
                {beans.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.remainingGrams <= 0 ? " (empty)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Brew date / time">
              <Input
                type="datetime-local"
                value={form.brewedAt}
                onChange={(e) => set("brewedAt", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Method">
              <Select value={form.method} onChange={(e) => set("method", e.target.value)}>
                <option>V60</option>
                <option>Kalita Wave</option>
                <option>Chemex</option>
                <option>Aeropress</option>
                <option>French Press</option>
                <option>Espresso</option>
                <option>Moka Pot</option>
                <option>Cold Brew</option>
                <option>Origami</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="Dose (g) *">
              <Input type="number" step="0.1" value={form.dose} onChange={(e) => set("dose", e.target.value)} required />
            </Field>
            <Field label="Water (g) *">
              <Input type="number" step="1" value={form.water} onChange={(e) => set("water", e.target.value)} required />
            </Field>
            <Field label="Ratio">
              <div className="h-10 rounded-lg border border-[var(--input)] bg-[var(--muted)]/40 flex items-center px-3 text-sm font-medium tabular-nums">
                1:{ratio}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Grinder">
              <Input value={form.grinder} onChange={(e) => set("grinder", e.target.value)} placeholder="Timemore C2" />
            </Field>
            <Field label="Grind size">
              <Select value={form.grindSize} onChange={(e) => set("grindSize", e.target.value)}>
                <option value="">—</option>
                <option>Coarse</option>
                <option>Medium</option>
                <option>Fine</option>
              </Select>
            </Field>
            <Field label="Grind adjustment">
              <Input type="number" value={form.grindAdjustment} onChange={(e) => set("grindAdjustment", e.target.value)} placeholder="clicks" />
            </Field>
            <Field label="Number of pours">
              <Input type="number" value={form.pours} onChange={(e) => set("pours", e.target.value)} />
            </Field>
          </div>

          <details className="rounded-lg border border-[var(--border)] p-3">
            <summary className="text-sm font-medium cursor-pointer">Optional — temp, time, notes</summary>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Field label="Water temp (°C)">
                <Input type="number" step="0.5" value={form.waterTemp} onChange={(e) => set("waterTemp", e.target.value)} />
              </Field>
              <Field label="Brew time (min)">
                <Input type="number" value={form.brewTimeMin} onChange={(e) => set("brewTimeMin", e.target.value)} />
              </Field>
              <Field label="Brew time (sec)">
                <Input type="number" value={form.brewTimeSec} onChange={(e) => set("brewTimeSec", e.target.value)} />
              </Field>
            </div>
            <Field label="Notes" className="mt-3">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Bloom 45s, first pour to 100g…" />
            </Field>
          </details>

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit || pending} size="lg">
              {pending ? "Saving…" : "Log brew"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
