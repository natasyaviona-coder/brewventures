"use client";

import * as React from "react";
import type { Bean } from "@/lib/types";
import type { BeanWithBrews, DashboardStats } from "@/lib/stats";
import { Dashboard } from "@/components/dashboard";
import { BeanCard } from "@/components/bean-card";
import { BeanDrawer } from "@/components/bean-drawer";
import { BeanForm } from "@/components/bean-form";
import { BrewForm } from "@/components/brew-form";
import { TastingForm } from "@/components/tasting-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

export function App({
  beans,
  stats,
  configError,
}: {
  beans: BeanWithBrews[];
  stats: DashboardStats;
  configError?: string | null;
}) {
  const [search, setSearch] = React.useState("");
  const [drawerBeanId, setDrawerBeanId] = React.useState<string | null>(null);
  const [beanFormOpen, setBeanFormOpen] = React.useState(false);
  const [editingBean, setEditingBean] = React.useState<Bean | null>(null);
  const [tastingBrewId, setTastingBrewId] = React.useState("");

  const drawerBean = drawerBeanId ? beans.find((b) => b.id === drawerBeanId) ?? null : null;

  React.useEffect(() => {
    if (drawerBeanId && !beans.some((b) => b.id === drawerBeanId)) {
      setDrawerBeanId(null);
    }
  }, [beans, drawerBeanId]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return beans;
    return beans.filter((b) =>
      [b.name, b.roaster, b.origin]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }, [beans, search]);

  const sectionRefs = {
    library: React.useRef<HTMLDivElement>(null),
    brew: React.useRef<HTMLDivElement>(null),
    tasting: React.useRef<HTMLDivElement>(null),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xl">☕</div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brewventures</h1>
            <p className="text-sm text-[var(--muted-foreground)] leading-tight">
              A personal coffee brewing journal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-1 rounded-lg border border-[var(--border)] p-1 text-sm">
            <button
              onClick={() => sectionRefs.library.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-3 py-1 rounded-md hover:bg-[var(--muted)]"
            >
              Library
            </button>
            <button
              onClick={() => sectionRefs.brew.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-3 py-1 rounded-md hover:bg-[var(--muted)]"
            >
              Brew
            </button>
            <button
              onClick={() => sectionRefs.tasting.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-3 py-1 rounded-md hover:bg-[var(--muted)]"
            >
              Rate
            </button>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {configError && (
        <div className="rounded-xl border border-[var(--destructive)] bg-[var(--destructive)]/10 p-4 text-sm">
          <div className="font-semibold text-[var(--destructive)]">Google Sheets not connected</div>
          <div className="text-[var(--foreground)] mt-1">
            Set <code className="px-1 rounded bg-[var(--muted)]">SHEETS_WEBAPP_URL</code> and{" "}
            <code className="px-1 rounded bg-[var(--muted)]">SHEETS_SECRET</code> in{" "}
            <code className="px-1 rounded bg-[var(--muted)]">.env.local</code>. See README for the Apps Script setup.
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2 font-mono">{configError}</div>
        </div>
      )}
      <Dashboard stats={stats} />

      <section ref={sectionRefs.library} className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Bean Library</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {beans.length} bean{beans.length === 1 ? "" : "s"} in your collection
            </p>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end min-w-[240px]">
            <Input
              placeholder="Search beans, roasters, origin…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button
              onClick={() => {
                setEditingBean(null);
                setBeanFormOpen(true);
              }}
            >
              + New Bean
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted-foreground)]">
            {beans.length === 0 ? (
              <>
                <div className="text-4xl mb-3">☕</div>
                <div className="font-medium text-[var(--foreground)]">No beans yet</div>
                <div className="mt-1">Add your first bean to start tracking brews.</div>
              </>
            ) : (
              <>No beans match &ldquo;{search}&rdquo;.</>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-slide-up">
            {filtered.map((bean) => (
              <BeanCard key={bean.id} bean={bean} onClick={() => setDrawerBeanId(bean.id)} />
            ))}
          </div>
        )}
      </section>

      <section ref={sectionRefs.brew}>
        <BrewForm beans={beans} />
      </section>

      <section ref={sectionRefs.tasting}>
        <TastingForm
          beans={beans}
          selectedBrewId={tastingBrewId}
          onSelectBrew={setTastingBrewId}
        />
      </section>

      <footer className="text-center text-xs text-[var(--muted-foreground)] pt-4">
        Made with ☕ · SQLite ·{" "}
        <a href="https://github.com/natasyaviona-coder/brewventures" target="_blank" rel="noreferrer" className="underline">
          source
        </a>
      </footer>

      <BeanDrawer
        bean={drawerBean}
        onClose={() => setDrawerBeanId(null)}
        onEdit={(bean) => {
          setEditingBean(bean);
          setBeanFormOpen(true);
        }}
        onEditTasting={(brewId) => {
          setTastingBrewId(brewId);
          setDrawerBeanId(null);
          sectionRefs.tasting.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <BeanForm
        open={beanFormOpen}
        onClose={() => {
          setBeanFormOpen(false);
          setEditingBean(null);
        }}
        editing={editingBean}
      />
    </div>
  );
}
