"use client";

import * as React from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/image-cropper";
import { createBean, updateBean } from "@/actions/beans";
import type { Bean } from "@prisma/client";
import { formatDateTimeLocalInput } from "@/lib/utils";

type BeanInput = {
  name: string;
  roaster: string;
  origin: string;
  process: string;
  roastLevel: string;
  purchaseDate: string;
  price: string;
  totalGrams: string;
  tastingNotes: string;
  personalNotes: string;
  imageUrl: string;
  altitude: string;
  variety: string;
  producer: string;
  roastDate: string;
};

function emptyForm(): BeanInput {
  return {
    name: "",
    roaster: "",
    origin: "",
    process: "",
    roastLevel: "",
    purchaseDate: "",
    price: "",
    totalGrams: "",
    tastingNotes: "",
    personalNotes: "",
    imageUrl: "",
    altitude: "",
    variety: "",
    producer: "",
    roastDate: "",
  };
}

function beanToForm(bean: Bean): BeanInput {
  return {
    name: bean.name,
    roaster: bean.roaster ?? "",
    origin: bean.origin ?? "",
    process: bean.process ?? "",
    roastLevel: bean.roastLevel ?? "",
    purchaseDate: bean.purchaseDate ? formatDateTimeLocalInput(bean.purchaseDate).split("T")[0] : "",
    price: bean.price != null ? String(bean.price) : "",
    totalGrams: String(bean.totalGrams),
    tastingNotes: bean.tastingNotes ?? "",
    personalNotes: bean.personalNotes ?? "",
    imageUrl: bean.imageUrl ?? "",
    altitude: bean.altitude ?? "",
    variety: bean.variety ?? "",
    producer: bean.producer ?? "",
    roastDate: bean.roastDate ? formatDateTimeLocalInput(bean.roastDate).split("T")[0] : "",
  };
}

const AUTOSAVE_KEY = "brewventures:bean-draft";

export function BeanForm({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Bean | null;
}) {
  const [form, setForm] = React.useState<BeanInput>(emptyForm());
  const [ocrRunning, setOcrRunning] = React.useState(false);
  const [rawImage, setRawImage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm(beanToForm(editing));
    } else {
      const draft = typeof window !== "undefined" ? window.localStorage.getItem(AUTOSAVE_KEY) : null;
      setForm(draft ? { ...emptyForm(), ...JSON.parse(draft) } : emptyForm());
    }
  }, [open, editing]);

  React.useEffect(() => {
    if (!open || editing) return;
    const id = setTimeout(() => {
      window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
    }, 400);
    return () => clearTimeout(id);
  }, [form, open, editing]);

  const set = <K extends keyof BeanInput>(key: K, value: BeanInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCropped(dataUrl: string) {
    setRawImage(null);
    set("imageUrl", dataUrl);
    setOcrRunning(true);
    try {
      const { default: Tesseract } = await import("tesseract.js");
      const { data } = await Tesseract.recognize(dataUrl, "eng");
      const text = data.text ?? "";
      applyOcr(text);
      toast.success("Scanned bean label — review the fields below");
    } catch (err) {
      console.error(err);
      toast.error("OCR failed. You can still fill fields manually.");
    } finally {
      setOcrRunning(false);
    }
  }

  function applyOcr(text: string) {
    const lower = text.toLowerCase();
    const grab = (patterns: RegExp[]) => {
      for (const p of patterns) {
        const m = text.match(p);
        if (m && m[1]) return m[1].trim().replace(/\s+/g, " ");
      }
      return "";
    };
    const updates: Partial<BeanInput> = {};
    const origin = grab([/origin[:\-\s]+([^\n]+)/i, /country[:\-\s]+([^\n]+)/i]);
    if (origin && !form.origin) updates.origin = origin;
    const process = grab([/process[:\-\s]+([^\n]+)/i]);
    if (process && !form.process) updates.process = process;
    const altitude = grab([/altitude[:\-\s]+([^\n]+)/i, /elevation[:\-\s]+([^\n]+)/i, /(\d{3,4}\s*-\s*\d{3,4}\s*(m|masl)?)/i]);
    if (altitude && !form.altitude) updates.altitude = altitude;
    const variety = grab([/variet(?:y|ies|al)[:\-\s]+([^\n]+)/i, /cultivar[:\-\s]+([^\n]+)/i]);
    if (variety && !form.variety) updates.variety = variety;
    const producer = grab([/producer[:\-\s]+([^\n]+)/i, /farmer[:\-\s]+([^\n]+)/i, /farm[:\-\s]+([^\n]+)/i]);
    if (producer && !form.producer) updates.producer = producer;
    const roastDate = grab([/roasted[:\s]+([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i, /roast date[:\s]+([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i]);
    if (roastDate && !form.roastDate) {
      const parsed = new Date(roastDate);
      if (!isNaN(parsed.getTime())) updates.roastDate = parsed.toISOString().slice(0, 10);
    }
    const notesMatch = text.match(/(?:tasting|notes)[:\-\s]+([^\n]+(?:\n[^\n:]+)?)/i);
    if (notesMatch && !form.tastingNotes) updates.tastingNotes = notesMatch[1].trim();

    if (!form.name && lower.length) {
      const firstLine = text.split("\n").map((s) => s.trim()).find((s) => s.length > 2 && s.length < 60);
      if (firstLine) updates.name = firstLine;
    }

    if (Object.keys(updates).length) setForm((f) => ({ ...f, ...updates }));
  }

  const canSubmit = form.name.trim().length > 0 && Number(form.totalGrams) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        const payload = { ...form, price: form.price || null };
        if (editing) {
          await updateBean(editing.id, payload);
          toast.success("Bean updated");
        } else {
          await createBean(payload);
          toast.success("Bean added");
          window.localStorage.removeItem(AUTOSAVE_KEY);
        }
        onClose();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to save bean");
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit bean" : "New bean"}
      description={editing ? "Update the bean details." : "Add a bean to your library. Upload the label photo for auto-fill."}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1 flex flex-col gap-3">
            <Field label="Bean name *">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ethiopia Guji" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Roaster">
                <Input value={form.roaster} onChange={(e) => set("roaster", e.target.value)} placeholder="Common Grounds" />
              </Field>
              <Field label="Origin">
                <Input value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Ethiopia" />
              </Field>
            </div>
          </div>
          <div className="sm:w-48 flex flex-col gap-2">
            <label className="text-sm font-medium">Bean label photo</label>
            <div className="relative aspect-square border-2 border-dashed border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--ring)] transition-colors cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="Bean" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--muted-foreground)] p-3 text-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span className="text-xs">Click to upload<br />(OCR autofill)</span>
                </div>
              )}
              {ocrRunning && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs animate-fade-in">
                  Scanning…
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Process">
            <Input value={form.process} onChange={(e) => set("process", e.target.value)} placeholder="Washed" />
          </Field>
          <Field label="Roast level">
            <Select value={form.roastLevel} onChange={(e) => set("roastLevel", e.target.value)}>
              <option value="">—</option>
              <option value="Light">Light</option>
              <option value="Medium-Light">Medium-Light</option>
              <option value="Medium">Medium</option>
              <option value="Medium-Dark">Medium-Dark</option>
              <option value="Dark">Dark</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Purchase date">
            <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
          </Field>
          <Field label="Price (IDR)">
            <Input type="number" step="1000" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="185000" />
          </Field>
          <Field label="Total grams *">
            <Input type="number" step="1" value={form.totalGrams} onChange={(e) => set("totalGrams", e.target.value)} placeholder="200" required />
          </Field>
        </div>

        <details className="rounded-lg border border-[var(--border)] p-3">
          <summary className="text-sm font-medium cursor-pointer">Extra details (from OCR or manual)</summary>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Altitude">
              <Input value={form.altitude} onChange={(e) => set("altitude", e.target.value)} placeholder="1800-2000 masl" />
            </Field>
            <Field label="Variety">
              <Input value={form.variety} onChange={(e) => set("variety", e.target.value)} placeholder="Heirloom" />
            </Field>
            <Field label="Producer / Farm">
              <Input value={form.producer} onChange={(e) => set("producer", e.target.value)} placeholder="Guji cooperative" />
            </Field>
            <Field label="Roast date">
              <Input type="date" value={form.roastDate} onChange={(e) => set("roastDate", e.target.value)} />
            </Field>
          </div>
        </details>

        <Field label="Tasting notes">
          <Textarea
            value={form.tastingNotes}
            onChange={(e) => set("tastingNotes", e.target.value)}
            placeholder="Blueberry, jasmine, honey…"
          />
        </Field>

        <Field label="Personal notes">
          <Textarea
            value={form.personalNotes}
            onChange={(e) => set("personalNotes", e.target.value)}
            placeholder="Bought after that Guji cupping — trying V60 first."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Add bean"}
          </Button>
        </div>
      </form>

      <ImageCropper
        open={!!rawImage}
        imageSrc={rawImage}
        onCancel={() => setRawImage(null)}
        onCropped={handleCropped}
      />
    </Modal>
  );
}
