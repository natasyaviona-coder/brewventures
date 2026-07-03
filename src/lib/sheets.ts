import type { Bean, BeanWithBrews, Brew, Tasting } from "@/lib/types";

const url = process.env.SHEETS_WEBAPP_URL;
const secret = process.env.SHEETS_SECRET;

export type { BeanWithBrews };

type ActionResponse<T> = { ok: true; result: T } | { ok: false; error: string };

async function call<T>(action: string, data?: unknown): Promise<T> {
  if (!url || !secret) {
    throw new Error(
      "Sheets not configured. Set SHEETS_WEBAPP_URL and SHEETS_SECRET in .env.local.",
    );
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, action, data: data ?? {} }),
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as ActionResponse<T>;
  if (!json.ok) throw new Error(json.error);
  return json.result;
}

export function newId(): string {
  return (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(
    /-/g,
    "",
  );
}

export const sheets = {
  getAll: () => call<{ beans: BeanWithBrews[] }>("getAll"),
  createBean: (data: Omit<Bean, "id" | "createdAt" | "updatedAt">) =>
    call<Bean>("createBean", data),
  updateBean: (id: string, data: Partial<Omit<Bean, "id" | "createdAt" | "updatedAt">>) =>
    call<Bean>("updateBean", { id, data }),
  deleteBean: (id: string) => call<null>("deleteBean", { id }),

  createBrew: (data: Omit<Brew, "id" | "createdAt" | "updatedAt">) =>
    call<Brew>("createBrew", data),
  updateBrew: (id: string, data: Partial<Omit<Brew, "id" | "createdAt" | "updatedAt">>) =>
    call<Brew>("updateBrew", { id, data }),
  deleteBrew: (id: string) => call<null>("deleteBrew", { id }),
  duplicateBrew: (id: string) => call<Brew>("duplicateBrew", { id }),

  upsertTasting: (data: Omit<Tasting, "id" | "createdAt" | "updatedAt">) =>
    call<Tasting>("upsertTasting", data),
  deleteTasting: (id: string) => call<null>("deleteTasting", { id }),
};
