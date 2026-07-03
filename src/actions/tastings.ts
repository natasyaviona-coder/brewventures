"use server";

import { sheets } from "@/lib/sheets";
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

function nn<T>(v: T | undefined | null | ""): T | null {
  return v === undefined || v === null || v === "" ? null : v;
}

export async function upsertTasting(raw: unknown) {
  const data = tastingSchema.parse(raw);
  const t = await sheets.upsertTasting({
    brewId: data.brewId,
    bitterness: data.bitterness,
    acidity: data.acidity,
    sweetness: data.sweetness,
    body: data.body,
    aroma: data.aroma,
    aftertaste: data.aftertaste,
    enjoyment: data.enjoyment,
    flavorNotes: nn(data.flavorNotes),
    comments: nn(data.comments),
  });
  revalidatePath("/");
  return t;
}

export async function deleteTasting(id: string) {
  await sheets.deleteTasting(id);
  revalidatePath("/");
}
