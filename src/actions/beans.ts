"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const beanSchema = z.object({
  name: z.string().min(1, "Name required"),
  roaster: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  process: z.string().optional().nullable(),
  roastLevel: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  totalGrams: z.coerce.number().positive("Total grams > 0"),
  tastingNotes: z.string().optional().nullable(),
  personalNotes: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  altitude: z.string().optional().nullable(),
  variety: z.string().optional().nullable(),
  producer: z.string().optional().nullable(),
  roastDate: z.string().optional().nullable(),
});

function parseDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function createBean(raw: unknown) {
  const data = beanSchema.parse(raw);
  const bean = await prisma.bean.create({
    data: {
      name: data.name,
      roaster: data.roaster || null,
      origin: data.origin || null,
      process: data.process || null,
      roastLevel: data.roastLevel || null,
      purchaseDate: parseDate(data.purchaseDate),
      price: data.price ?? null,
      totalGrams: data.totalGrams,
      remainingGrams: data.totalGrams,
      tastingNotes: data.tastingNotes || null,
      personalNotes: data.personalNotes || null,
      imageUrl: data.imageUrl || null,
      altitude: data.altitude || null,
      variety: data.variety || null,
      producer: data.producer || null,
      roastDate: parseDate(data.roastDate),
    },
  });
  revalidatePath("/");
  return bean;
}

export async function updateBean(id: string, raw: unknown) {
  const data = beanSchema.partial().parse(raw);
  const existing = await prisma.bean.findUniqueOrThrow({ where: { id } });
  const newTotal = data.totalGrams ?? existing.totalGrams;
  const used = existing.totalGrams - existing.remainingGrams;
  const bean = await prisma.bean.update({
    where: { id },
    data: {
      ...data,
      purchaseDate: data.purchaseDate !== undefined ? parseDate(data.purchaseDate) : undefined,
      roastDate: data.roastDate !== undefined ? parseDate(data.roastDate) : undefined,
      totalGrams: newTotal,
      remainingGrams: Math.max(0, newTotal - used),
    },
  });
  revalidatePath("/");
  return bean;
}

export async function deleteBean(id: string) {
  await prisma.bean.delete({ where: { id } });
  revalidatePath("/");
}
