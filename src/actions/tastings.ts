"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const rating = z.coerce.number().int().min(1).max(5);

const tastingSchema = z.object({
  brewId: z.string().min(1),
  bitterness: rating,
  acidity: rating,
  sweetness: rating,
  body: rating,
  aroma: rating,
  aftertaste: rating,
  enjoyment: rating,
  flavorNotes: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
});

export async function upsertTasting(raw: unknown) {
  const data = tastingSchema.parse(raw);
  const t = await prisma.tasting.upsert({
    where: { brewId: data.brewId },
    create: {
      brewId: data.brewId,
      bitterness: data.bitterness,
      acidity: data.acidity,
      sweetness: data.sweetness,
      body: data.body,
      aroma: data.aroma,
      aftertaste: data.aftertaste,
      enjoyment: data.enjoyment,
      flavorNotes: data.flavorNotes || null,
      comments: data.comments || null,
    },
    update: {
      bitterness: data.bitterness,
      acidity: data.acidity,
      sweetness: data.sweetness,
      body: data.body,
      aroma: data.aroma,
      aftertaste: data.aftertaste,
      enjoyment: data.enjoyment,
      flavorNotes: data.flavorNotes || null,
      comments: data.comments || null,
    },
  });
  revalidatePath("/");
  return t;
}

export async function deleteTasting(id: string) {
  await prisma.tasting.delete({ where: { id } });
  revalidatePath("/");
}
