"use client";
import { INVENTORY_METRIC_LABELS, INVENTORY_CLASSIFICATION_ORDER, INVENTORY_CLASSIFICATION_LABELS, INVENTORY_CLASSIFICATION_DESCRIPTIONS, inventoryMetricLabel, inventoryMetricOrder } from "../../lib/scans/inventory-resource-semantics";
import type { ExecutiveRuntimeCard } from "../../lib/scans/executive-runtime-cards";
import type { NetworkInventoryOverview } from "../../lib/scans/network-inventory-overview";
import { DisclosureChevron } from "./report-finding-row";
import { VendorBrandIcon } from "./vendor-brand-chip";
import { ServicesSignalSnapshot } from "./services-signal-snapshot";
import { summarizeSiteIntegrityLinks, type SiteIntegritySiteReport } from "../../lib/scans/site-integrity-report";
import { ScanLiveValue } from "./scan-live-value";

export type InventoryAssessmentCounts = { nonEssential: number; review: number; contextual: number; essential: number; unclassified?: number };
export type ReportInventoryMetric = { label: string; value: number | null | undefined; lowerBound?: boolean; counts?: InventoryAssessmentCounts; note?: string; overview?: NetworkInventoryOverview };

const classificationColors = { nonEssential: "bg-rose-500", review: "bg-amber-500", unclassified: "bg-slate-400", contextual: "bg-sky-500", essential: "bg-blue-500" } as const;

const classificationKeys = { "Non-essential": "nonEssential", Review: "review", Unclassified: "unclassified", Contextual: "contextual", Essential: "essential" } as const;
const classifications = INVENTORY_CLASSIFICATION_ORDER.map(value => [INVENTORY_CLASSIFICATION_LABELS[value]!, classificationKeys[value], INVENTORY_CLASSIFICATION_DESCRIPTIONS[value]] as const);

/** Only projected privacy evidence belongs in the executive cards. */
export function ReportRuntimeSummary({ cards }: { cards: ExecutiveRuntimeCard[] }) {
  return <section aria-label="Pre-consent privacy evidence" className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
    <div className="grid divide-y divide-zinc-200 md:grid-cols-3 md:divide-y-0">
      {cards.map((card, index) => {
        const state = card.state === "observed" ? "Observed" : card.state === "review" ? "Review needed" : card.state === "not_observed" ? "Not observed" : "Not confirmed";
        const dot = card.state === "observed" ? "bg-rose-500" : card.state === "review" ? "bg-amber-500" : "bg-slate-400";
        return <div key={card.id} className={`flex min-w-0 flex-col px-4 py-3 ${index ? "md:border-l md:border-zinc-200" : ""}`}>
          <h3 className="text-sm font-medium text-slate-500">{card.label}</h3>
          <div className="mt-2 flex min-h-9 flex-wrap items-baseline gap-x-3 gap-y-1">
            {card.count !== null ? <p title={card.lowerBound ? "At least this many distinct items are verified in retained evidence" : undefined} className="text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">{card.lowerBound ? "≥" : ""}{card.count.toLocaleString()}</p> : null}
            <p className={`flex items-center gap-2 ${card.count === null ? "text-lg font-semibold text-slate-800" : "text-xs text-slate-600"}`}><span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />{state}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{card.description}</p>
          {card.vendors.length ? <div className="mt-2 flex flex-wrap items-center gap-2">{card.vendors.slice(0, 2).map(name => <span key={name} className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-600"><VendorBrandIcon label={name} /><span className="max-w-36 truncate" title={name}>{name}</span></span>)}{card.vendors.length > 2 ? <span className="text-xs text-slate-500">+{card.vendors.length - 2} more</span> : null}</div> : null}
          <a href="#evidence" className="mt-auto inline-block self-start rounded pt-2 text-xs font-medium text-sky-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600" aria-label={`View ${card.label.toLowerCase()} evidence`}>View evidence <span aria-hidden="true">↗</span></a>
        </div>;
      })}
    </div>

  </section>;
}

/** Inventory only. Risk and remediation remain in canonical priority findings. */
export function ReportInventorySummary({ metrics, updating = false, siteIntegrity }: {
  metrics: ReportInventoryMetric[];
  updating?: boolean;
  siteIntegrity?: SiteIntegritySiteReport;
}) {
  const network = metrics.find(metric => metric.overview);
  const overview = network?.overview;
  const technical: ReportInventoryMetric[] = overview ? [
    { label: INVENTORY_METRIC_LABELS.requests, value: overview.distinctResources, counts: overview.distinctClassifications?.requests },
    { label: INVENTORY_METRIC_LABELS.storage, value: overview.distinctStorage, counts: overview.distinctClassifications?.storage },
    { label: INVENTORY_METRIC_LABELS.frames, value: overview.distinctEmbeds, counts: overview.distinctClassifications?.embeds },
  ] : metrics.map(metric => ({ ...metric, label: inventoryMetricLabel(metric.label) })).sort((a, b) => inventoryMetricOrder(a.label) - inventoryMetricOrder(b.label));
  const hiddenLinks = siteIntegrity ? summarizeSiteIntegrityLinks(siteIntegrity) : null;
  return <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" aria-label="Inventory summary">
    <div className="grid grid-cols-2 items-start divide-x divide-zinc-200 border-b border-zinc-200">
      <ServicesSignalSnapshot overview={overview} card />
      <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2.5">
        <p className="text-xs leading-4 text-slate-500">Hidden links</p>
        <p className="text-xl font-semibold tabular-nums text-slate-950" title={hiddenLinks?.count != null ? `Retained link occurrences across ${hiddenLinks.pages} pages` : undefined}>{hiddenLinks?.count != null && hiddenLinks.lowerBound ? "≥" : ""}<ScanLiveValue value={hiddenLinks?.count} active={updating} /></p>
      </div>
    </div>
    <div className="overflow-x-auto" role="region" aria-label="Inventory totals" tabIndex={0}>
      <div className="grid min-w-[360px] grid-cols-3 divide-x divide-zinc-200">
        {technical.map(tile => <div key={tile.label} className="min-w-0 px-3 py-2.5">
          <p className="min-h-4 text-xs leading-4 text-slate-500">{tile.label}</p>
          <div className="mt-1 flex items-baseline justify-between gap-2"><strong className="text-xl font-semibold tabular-nums text-slate-950"><ScanLiveValue value={tile.value} active={updating} /></strong></div>
        </div>)}
      </div>
    </div>
    {metrics.filter(metric => metric.note).map(metric => <p key={metric.label} className="border-t border-zinc-100 px-4 py-2 text-xs leading-5 text-slate-600">{metric.note}</p>)}
    {technical.length ? <details className="group/technical border-t border-zinc-200">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs marker:hidden hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-sky-600 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-medium text-zinc-700"><DisclosureChevron className="text-zinc-400 group-open/technical:rotate-180" />Resource counts & classifications</span>
      </summary>
      <div className="overflow-x-auto border-t border-zinc-100 bg-white px-4 py-3">
        <p className="mb-4 max-w-3xl text-xs leading-5 text-zinc-500">{overview ? "Each resource is counted once. Services group requests, cookies/storage and frames." : "Retained inventory counts and classifications."}</p>
        <div className="grid min-w-[508px] grid-cols-3 divide-x divide-zinc-200">{technical.map((metric, index) => <div key={metric.label} className={`min-w-0 py-0 ${index ? "pl-4" : ""} ${index < technical.length - 1 ? "pr-4" : ""}`}>
          <p className="mb-2 text-xs font-semibold text-zinc-700">{metric.label}<span className="ml-2 font-normal text-zinc-500 tabular-nums">{metric.value?.toLocaleString() ?? "Unavailable"}</span></p>
          <ClassificationCounts counts={metric.counts} />
        </div>)}</div>
      </div>
    </details> : null}
  </section>;
}

function ClassificationCounts({ counts }: { counts?: InventoryAssessmentCounts }) {
  return counts ? <dl className="mt-3 space-y-1.5 text-[11px] tabular-nums">{classifications.filter(([, key]) => counts[key] != null).map(([label, key, description]) => <div key={key} className="flex items-start justify-between gap-2"><dt title={description} className="flex shrink-0 items-start gap-1.5 whitespace-nowrap text-slate-600"><span aria-hidden="true" className={`mt-1 h-2 w-2 shrink-0 rounded-full ${classificationColors[key]}`} />{label}</dt><dd className="shrink-0 text-zinc-700">{counts[key]}</dd></div>)}</dl> : <p className="mt-3 text-xs text-zinc-500">Classification unavailable.</p>;
}
