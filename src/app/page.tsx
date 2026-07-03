import { prisma } from "@/lib/prisma";
import { dashboardStats, type BeanWithBrews } from "@/lib/stats";
import { App } from "@/components/app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const beans = (await prisma.bean.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brews: {
        include: { tasting: true },
        orderBy: { brewedAt: "desc" },
      },
    },
  })) as BeanWithBrews[];

  const stats = dashboardStats(beans);
  return <App beans={beans} stats={stats} />;
}
