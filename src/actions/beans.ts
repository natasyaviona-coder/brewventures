"use server";

import { sheets } from "@/lib/sheets";
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

function nn<T>(v: T | undefined | null | ""): T | null {
  return v === undefined || v === null || v === "" ? null : v;
}

function parseDate(v?: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function createBean(raw: unknown) {
  const data = beanSchema.parse(raw);
  const bean = await sheets.createBean({
    name: data.name,
    roaster: nn(data.roaster),
    origin: nn(data.origin),
    process: nn(data.process),
    roastLevel: nn(data.roastLevel),
    purchaseDate: parseDate(data.purchaseDate),
    price: nn(data.price),
    totalGrams: data.totalGrams,
    remainingGrams: data.totalGrams,
    tastingNotes: nn(data.tastingNotes),
    personalNotes: nn(data.personalNotes),
    imageUrl: nn(data.imageUrl),
    altitude: nn(data.altitude),
    variety: nn(data.variety),
    producer: nn(data.producer),
    roastDate: parseDate(data.roastDate),
  });
  revalidatePath("/");
  return bean;
}

export async function updateBean(id: string, raw: unknown) {
  const data = beanSchema.partial().parse(raw);
  const bean = await sheets.updateBean(id, {
    ...data,
    purchaseDate: data.purchaseDate !== undefined ? parseDate(data.purchaseDate) : undefined,
    roastDate: data.roastDate !== undefined ? parseDate(data.roastDate) : undefined,
  });
  revalidatePath("/");
  return bean;
}

export async function deleteBean(id: string) {
  await sheets.deleteBean(id);
  revalidatePath("/");
}
