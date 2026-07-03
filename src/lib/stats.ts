import type { BeanWithBrews, Tasting } from "@/lib/types";

export type { BeanWithBrews };

export function beanAverageEnjoyment(bean: BeanWithBrews): number | null {
  const scores = bean.brews
    .map((b) => b.tasting?.enjoyment)
    .filter((s): s is number => typeof s === "number");
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export type FlavorProfile = {
  bitterness: number;
  acidity: number;
  sweetness: number;
  body: number;
  aroma: number;
  aftertaste: number;
};

export function beanFlavorProfile(bean: BeanWithBrews): FlavorProfile | null {
  const ts = bean.brews.map((b) => b.tasting).filter((t): t is Tasting => !!t);
  if (!ts.length) return null;
  const avg = (k: keyof FlavorProfile) =>
    ts.reduce((sum, t) => sum + (t[k] as number), 0) / ts.length;
  return {
    bitterness: avg("bitterness"),
    acidity: avg("acidity"),
    sweetness: avg("sweetness"),
    body: avg("body"),
    aroma: avg("aroma"),
    aftertaste: avg("aftertaste"),
  };
}

export function beanBestBrew(bean: BeanWithBrews) {
  return bean.brews
    .filter((b) => b.tasting)
    .sort((a, b) => (b.tasting!.enjoyment ?? 0) - (a.tasting!.enjoyment ?? 0))[0];
}

export type DashboardStats = {
  totalBeans: number;
  totalBrews: number;
  avgEnjoyment: number | null;
  favoriteBean: { id: string; name: string; avg: number } | null;
  mostBrewedBean: { id: string; name: string; count: number } | null;
};

export function dashboardStats(beans: BeanWithBrews[]): DashboardStats {
  const totalBeans = beans.length;
  const totalBrews = beans.reduce((s, b) => s + b.brews.length, 0);

  const allEnjoyment = beans
    .flatMap((b) => b.brews.map((br) => br.tasting?.enjoyment))
    .filter((s): s is number => typeof s === "number");
  const avgEnjoyment = allEnjoyment.length
    ? allEnjoyment.reduce((a, b) => a + b, 0) / allEnjoyment.length
    : null;

  let favoriteBean: DashboardStats["favoriteBean"] = null;
  let mostBrewedBean: DashboardStats["mostBrewedBean"] = null;

  for (const bean of beans) {
    const avg = beanAverageEnjoyment(bean);
    if (avg !== null && (!favoriteBean || avg > favoriteBean.avg)) {
      favoriteBean = { id: bean.id, name: bean.name, avg };
    }
    if (!mostBrewedBean || bean.brews.length > mostBrewedBean.count) {
      if (bean.brews.length > 0) {
        mostBrewedBean = { id: bean.id, name: bean.name, count: bean.brews.length };
      }
    }
  }

  return { totalBeans, totalBrews, avgEnjoyment, favoriteBean, mostBrewedBean };
}
