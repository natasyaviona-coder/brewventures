import type { DashboardStats } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between text-[var(--muted-foreground)]">
          <span className="text-xs uppercase tracking-wide font-medium">{label}</span>
          <span>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-[var(--muted-foreground)] mt-1 truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}

const iconClass = "opacity-70";

export function Dashboard({ stats }: { stats: DashboardStats }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Stat
        label="Total Beans"
        value={stats.totalBeans}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
            <ellipse cx="12" cy="12" rx="6" ry="10" />
            <path d="M12 2c0 5-3 8-6 10 3 2 6 5 6 10" />
          </svg>
        }
      />
      <Stat
        label="Total Brews"
        value={stats.totalBrews}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
            <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
            <path d="M6 2v2M10 2v2M14 2v2" />
          </svg>
        }
      />
      <Stat
        label="Avg Enjoyment"
        value={stats.avgEnjoyment !== null ? `${stats.avgEnjoyment.toFixed(1)} ★` : "—"}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        }
      />
      <Stat
        label="Favorite Bean"
        value={stats.favoriteBean?.name ?? "—"}
        sub={stats.favoriteBean ? `${stats.favoriteBean.avg.toFixed(1)} ★ avg` : "No ratings yet"}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        }
      />
      <Stat
        label="Most Brewed"
        value={stats.mostBrewedBean?.name ?? "—"}
        sub={stats.mostBrewedBean ? `${stats.mostBrewedBean.count} brews` : "No brews yet"}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
            <path d="M3 3v18h18" />
            <path d="M7 12l4-4 4 4 5-5" />
          </svg>
        }
      />
    </section>
  );
}
