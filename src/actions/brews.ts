"use server";

import { sheets } from "@/lib/sheets";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const brewSchema = z.object({
  beanId: z.string().min(1),
  brewedAt: z.string().optional().nullable(),
  method: z.string().default("V60"),
  dose: z.coerce.number().positive(),
  water: z.coerce.number().positive(),
  grinder: z.string().optional().nullable(),
  grindSize: z.string().optional().nullable(),
  grindAdjustment: z.coerce.number().int().optional().nullable(),
  pours: z.coerce.number().int().optional().nullable(),
  waterTemp: z.coerce.number().optional().nullable(),
  brewTimeSec: z.coerce.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function nn<T>(v: T | undefined | null | ""): T | null {
  return v === undefined || v === null || v === "" ? null : v;
}

function parseDate(v?: string | null): string {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function createBrew(raw: unknown) {
  const data = brewSchema.parse(raw);
  const brew = await sheets.createBrew({
    beanId: data.beanId,
    brewedAt: parseDate(data.brewedAt),
    method: data.method,
    dose: data.dose,
    water: data.water,
    grinder: nn(data.grinder),
    grindSize: nn(data.grindSize),
    grindAdjustment: nn(data.grindAdjustment),
    pours: nn(data.pours),
    waterTemp: nn(data.waterTemp),
    brewTimeSec: nn(data.brewTimeSec),
    notes: nn(data.notes),
  });
  revalidatePath("/");
  return brew;
}

export async function updateBrew(id: string, raw: unknown) {
  const data = brewSchema.partial().parse(raw);
  const brew = await sheets.updateBrew(id, {
    ...data,
    brewedAt: data.brewedAt !== undefined ? parseDate(data.brewedAt) : undefined,
  });
  revalidatePath("/");
  return brew;
}

export async function deleteBrew(id: string) {
  await sheets.deleteBrew(id);
  revalidatePath("/");
}

export async function duplicateBrew(id: string) {
  const brew = await sheets.duplicateBrew(id);
  revalidatePath("/");
  return brew;
}
