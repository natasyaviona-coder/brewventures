"use server";

import { prisma } from "@/lib/prisma";
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

function parseDate(v?: string | null) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function createBrew(raw: unknown) {
  const data = brewSchema.parse(raw);

  const brew = await prisma.$transaction(async (tx) => {
    const bean = await tx.bean.findUniqueOrThrow({ where: { id: data.beanId } });
    const newRemaining = Math.max(0, bean.remainingGrams - data.dose);
    await tx.bean.update({
      where: { id: data.beanId },
      data: { remainingGrams: newRemaining },
    });
    return tx.brew.create({
      data: {
        beanId: data.beanId,
        brewedAt: parseDate(data.brewedAt) ?? new Date(),
        method: data.method,
        dose: data.dose,
        water: data.water,
        grinder: data.grinder || null,
        grindSize: data.grindSize || null,
        grindAdjustment: data.grindAdjustment ?? null,
        pours: data.pours ?? null,
        waterTemp: data.waterTemp ?? null,
        brewTimeSec: data.brewTimeSec ?? null,
        notes: data.notes || null,
      },
    });
  });

  revalidatePath("/");
  return brew;
}

export async function updateBrew(id: string, raw: unknown) {
  const data = brewSchema.partial().parse(raw);
  const existing = await prisma.brew.findUniqueOrThrow({ where: { id } });

  const brew = await prisma.$transaction(async (tx) => {
    if (data.dose !== undefined && data.dose !== existing.dose) {
      const delta = data.dose - existing.dose;
      await tx.bean.update({
        where: { id: existing.beanId },
        data: { remainingGrams: { decrement: delta } },
      });
    }
    return tx.brew.update({
      where: { id },
      data: {
        ...data,
        brewedAt: data.brewedAt ? parseDate(data.brewedAt) : undefined,
        grinder: data.grinder ?? undefined,
        grindSize: data.grindSize ?? undefined,
        notes: data.notes ?? undefined,
      },
    });
  });

  revalidatePath("/");
  return brew;
}

export async function deleteBrew(id: string) {
  const existing = await prisma.brew.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.bean.update({
      where: { id: existing.beanId },
      data: { remainingGrams: { increment: existing.dose } },
    }),
    prisma.brew.delete({ where: { id } }),
  ]);
  revalidatePath("/");
}

export async function duplicateBrew(id: string) {
  const src = await prisma.brew.findUniqueOrThrow({ where: { id } });
  return createBrew({
    beanId: src.beanId,
    method: src.method,
    dose: src.dose,
    water: src.water,
    grinder: src.grinder,
    grindSize: src.grindSize,
    grindAdjustment: src.grindAdjustment,
    pours: src.pours,
    waterTemp: src.waterTemp,
    brewTimeSec: src.brewTimeSec,
    notes: src.notes,
  });
}
