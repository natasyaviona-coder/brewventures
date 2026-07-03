import { sheets } from "@/lib/sheets";
import { dashboardStats } from "@/lib/stats";
import { App } from "@/components/app";

export const dynamic = "force-dynamic";

export default async function Home() {
  let beans: Awaited<ReturnType<typeof sheets.getAll>>["beans"] = [];
  let configError: string | null = null;

  try {
    const result = await sheets.getAll();
    beans = result.beans;
  } catch (e) {
    configError = e instanceof Error ? e.message : "Unknown sheets error";
  }

  const stats = dashboardStats(beans);
  return <App beans={beans} stats={stats} configError={configError} />;
}
