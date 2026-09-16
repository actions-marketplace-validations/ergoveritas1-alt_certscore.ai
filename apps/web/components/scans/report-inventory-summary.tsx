"use client";
import type { NetworkInventoryOverview } from "../../lib/scans/network-inventory-overview";
import type { ReactNode } from "react";
import { ScanLiveValue } from "./scan-live-value";

export type InventoryAssessmentCounts = { nonEssential: number; review: number; contextual: number; essential: number; unclassified?: number };
export type ReportInventoryMetric = { label: string; value: number | null | undefined; lowerBound?: boolean; counts?: InventoryAssessmentCounts; note?: string; overview?: NetworkInventoryOverview };

function RequestActivity({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return collapsed ? <details className="mt-2"><summary className="cursor-pointer text-xs text-slate-600">Request activity</summary>{children}</details> : <>{children}</>;
}

/** Shared presentation only: counts and classifications are supplied by canonical projections. */
export function ReportInventorySummary({ metrics, updating = false }: { metrics: ReportInventoryMetric[]; updating?: boolean }) {
  return <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-3" aria-label="Inventory summary">
    {metrics.map(metric => <div key={metric.label} className="flex min-w-0 flex-col bg-white px-3 py-3">
      <span className="text-xs font-medium text-slate-500">{metric.overview ? "Identified services" : metric.label}</span>
      <div className="mt-auto pt-1">
      {metric.overview ? <><strong className="my-1 block text-2xl font-semibold tracking-tight text-slate-950 tabular-nums"><ScanLiveValue value={metric.overview.identifiedServices} active={updating} /></strong><p className="text-xs leading-4 text-slate-600">{metric.overview.distinctResources} distinct network resources</p>{metric.overview.unattributedResources > 0 ? <p className="mt-1 text-xs leading-4 text-slate-500">{metric.overview.unattributedResources} resources have no identified service.</p> : null}</> : null}
      <RequestActivity collapsed={Boolean(metric.overview)}>
      <strong className="my-1 block text-2xl font-semibold tracking-tight text-slate-950 tabular-nums"><ScanLiveValue value={metric.lowerBound && metric.value != null ? `≥${metric.value.toLocaleString()}` : metric.value} active={updating} /></strong>
      {metric.overview ? <p className="mb-2 text-xs text-slate-500">Request events, including repeats across scanned pages. These counts are not findings.</p> : null}
      <dl className="space-y-0.5 text-xs leading-4 tabular-nums" aria-label="Inventory classifications">
        {([
          ["Non-essential", "nonEssential", "bg-rose-500"], ["Classification review", "review", "bg-amber-500"],
          ["Purpose unclassified", "unclassified", "bg-slate-400"],
          ["Contextual", "contextual", "bg-sky-500"], ["Essential", "essential", "bg-blue-500"],
        ] as const).filter(([, key]) => key !== "unclassified" || metric.counts?.unclassified !== undefined).map(([label, key, color]) => <div key={key} className="flex items-center justify-between gap-2">
          <dt title={key === "contextual" ? "Classification of observed content; consent-related findings are assessed separately." : undefined} className="flex items-center gap-1.5 text-slate-600"><span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />{label}</dt>
          <dd className="font-medium text-slate-900"><ScanLiveValue value={metric.counts?.[key]} active={updating} /></dd>
        </div>)}
      </dl>
      </RequestActivity>
      {metric.note ? <p className="mt-1 text-[10px] text-amber-800">{metric.note}</p> : null}
      </div>
    </div>)}
  </div>;
}
