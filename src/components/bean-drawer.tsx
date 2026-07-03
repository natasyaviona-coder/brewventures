"use client";

import * as React from "react";
import { Drawer, Confirm } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/rating";
import { BrewDetail } from "@/components/brew-detail";
import { formatDateTime, formatDate } from "@/lib/utils";
import {
  beanAverageEnjoyment,
  beanBestBrew,
  beanFlavorProfile,
  type BeanWithBrews,
} from "@/lib/stats";
import { deleteBean } from "@/actions/beans";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function BeanDrawer({
  bean,
  onClose,
  onEdit,
  onEditTasting,
}: {
  bean: BeanWithBrews | null;
  onClose: () => void;
  onEdit: (bean: BeanWithBrews) => void;
  onEditTasting: (brewId: string) => void;
}) {
  const [expandedBrewId, setExpandedBrewId] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!bean) setExpandedBrewId(null);
  }, [bean]);

  if (!bean) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;

  const avg = beanAverageEnjoyment(bean);
  const profile = beanFlavorProfile(bean);
  const best = beanBestBrew(bean);
  const sortedBrews = [...bean.brews].sort(
    (a, b) => new Date(b.brewedAt).getTime() - new Date(a.brewedAt).getTime(),
  );

  const trendData = sortedBrews
    .filter((b) => b.tasting)
    .map((b) => ({
      date: formatDate(b.brewedAt),
      enjoyment: b.tasting!.enjoyment,
    }))
    .reverse();

  return (
    <Drawer open onClose={onClose} title={bean.name} description={[bean.roaster, bean.origin].filter(Boolean).join(" • ") || undefined}>
      <div className="flex flex-col gap-6">
        {bean.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bean.imageUrl} alt={bean.name} className="w-full max-h-64 object-cover rounded-lg border border-[var(--border)]" />
        )}

        <section>
          <SectionHeader>Bean information</SectionHeader>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {bean.roaster && <Info label="Roaster" value={bean.roaster} />}
            {bean.origin && <Info label="Origin" value={bean.origin} />}
            {bean.process && <Info label="Process" value={bean.process} />}
            {bean.roastLevel && <Info label="Roast level" value={bean.roastLevel} />}
            {bean.altitude && <Info label="Altitude" value={bean.altitude} />}
            {bean.variety && <Info label="Variety" value={bean.variety} />}
            {bean.producer && <Info label="Producer" value={bean.producer} />}
            {bean.roastDate && <Info label="Roast date" value={formatDate(bean.roastDate)} />}
            {bean.purchaseDate && <Info label="Purchased" value={formatDate(bean.purchaseDate)} />}
            {bean.price != null && <Info label="Price" value={`Rp ${bean.price.toLocaleString()}`} />}
            <Info label="Total" value={`${bean.totalGrams}g`} />
            <Info label="Remaining" value={`${Math.round(bean.remainingGrams)}g`} />
          </dl>
          {bean.tastingNotes && (
            <div className="mt-4 text-sm">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">Roaster tasting notes</div>
              <p className="whitespace-pre-wrap">{bean.tastingNotes}</p>
            </div>
          )}
          {bean.personalNotes && (
            <div className="mt-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-1">My notes</div>
              <p className="whitespace-pre-wrap">{bean.personalNotes}</p>
            </div>
          )}
        </section>

        {(avg !== null || profile || best) && (
          <section>
            <SectionHeader>Summary</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {avg !== null && (
                <div className="p-3 rounded-lg bg-[var(--muted)]/50">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Avg enjoyment</div>
                  <div className="text-xl font-bold mt-1">{avg.toFixed(1)} ★</div>
                </div>
              )}
              {best && (
                <div className="p-3 rounded-lg bg-[var(--muted)]/50">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Best brew</div>
                  <div className="text-sm font-medium mt-1">{formatDateTime(best.brewedAt)}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {best.dose}g · {best.tasting!.enjoyment}★
                  </div>
                </div>
              )}
              {profile && (
                <div className="p-3 rounded-lg bg-[var(--muted)]/50">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Avg profile</div>
                  <div className="text-xs mt-1 space-y-0.5">
                    <ProfileRow label="Bitter" value={profile.bitterness} />
                    <ProfileRow label="Acid" value={profile.acidity} />
                    <ProfileRow label="Sweet" value={profile.sweetness} />
                    <ProfileRow label="Body" value={profile.body} />
                  </div>
                </div>
              )}
            </div>

            {trendData.length >= 2 && (
              <div className="mt-4 h-40">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-2">Enjoyment trend</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} stroke="var(--muted-foreground)" />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} fontSize={10} stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="enjoyment"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--primary)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        <section>
          <SectionHeader>Brewing history ({bean.brews.length})</SectionHeader>
          {sortedBrews.length === 0 ? (
            <div className="text-sm text-[var(--muted-foreground)] italic py-2">
              No brews yet — log one from the Brew section below.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 text-xs uppercase tracking-wide text-[var(--muted-foreground)] px-2">
                <span>Date</span>
                <span>Grind</span>
                <span>Water</span>
                <span>Dose</span>
                <span>Rating</span>
              </div>
              {sortedBrews.map((brew) => (
                <React.Fragment key={brew.id}>
                  <button
                    onClick={() => setExpandedBrewId((id) => (id === brew.id ? null : brew.id))}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 text-sm px-2 py-2 rounded-md hover:bg-[var(--muted)] transition-colors text-left items-center"
                  >
                    <span className="font-medium truncate">{formatDateTime(brew.brewedAt)}</span>
                    <span className="text-[var(--muted-foreground)] text-xs">
                      {brew.grindSize ?? "—"}
                    </span>
                    <span className="text-[var(--muted-foreground)] text-xs">{brew.water}g</span>
                    <span className="text-[var(--muted-foreground)] text-xs">{brew.dose}g</span>
                    <span>
                      {brew.tasting ? (
                        <Stars value={brew.tasting.enjoyment} readOnly size={12} />
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">—</span>
                      )}
                    </span>
                  </button>
                  {expandedBrewId === brew.id && (
                    <BrewDetail
                      brew={brew}
                      onDone={() => setExpandedBrewId(null)}
                      onEditTasting={onEditTasting}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-wrap gap-2 justify-end pt-2 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={() => onEdit(bean)}>Edit bean</Button>
          <Button
            variant="ghost"
            onClick={() => setConfirmOpen(true)}
            className="text-[var(--destructive)]"
          >
            Delete bean
          </Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </section>
      </div>

      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            try {
              await deleteBean(bean.id);
              toast.success("Bean deleted");
              onClose();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          });
        }}
        title="Delete this bean?"
        description={`All ${bean.brews.length} brew${bean.brews.length === 1 ? "" : "s"} and tastings for this bean will also be deleted.`}
      />
    </Drawer>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3">{children}</h3>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted-foreground)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--primary)] rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-6 text-right tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}
