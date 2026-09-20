import type { SinglePageResourceInventory } from "../../../lib/scans/single-page-resource-inventory";
import type { ReportInventoryMetric } from "../../../components/scans/report-inventory-summary";
import { buildNetworkInventoryOverview } from "../../../lib/scans/network-inventory-overview";

type Resource = SinglePageResourceInventory["resources"][number];
type Service = SinglePageResourceInventory["services"][number];
export type InventoryScenario = "supplied" | "empty" | "single" | "large";

/** Synthetic UI fixture only: no network capture, persisted concerns, or scoring. */
export function inventoryLayoutFixture(scenario: InventoryScenario, pageId: string) {
  const names = scenario === "empty" ? [] : scenario === "single" ? ["Google Fonts"] : ["Google Maps", "YouTube", "Facebook", "Google Fonts", "Google Static Assets", "BST DSGVO Cookie notice plugin, non-TCF", ...(scenario === "large" ? Array.from({ length: 42 }, (_, i) => `Example integration ${i + 7}`) : [])];
  const services: Service[] = names.map((name, i) => ({ key: `fixture-service-${i}`, name, pageIds: [pageId], purposes: [], origins: [], resources: [],
    context: { identity: { product: name, vendor: name.startsWith("Google") ? "Google" : name, entity: "Layout fixture", registryVersion: "layout-fixture" }, provider: null, headquarters: null, transfer: null, policy: { status: "unknown", mentions: [], reviewed: [] } },
  }));
  const unknown: Service = { key: "fixture-unclassified", name: "Unclassified resources", pageIds: [pageId], purposes: [], origins: [], resources: [], context: { identity: null, provider: null, headquarters: null, transfer: null, policy: { status: "unknown", mentions: [], reviewed: [] } } };
  const knownCount = scenario === "supplied" ? 51 : names.length;
  const requestCount = scenario === "supplied" ? 196 : scenario === "large" ? 240 : names.length;
  const frameCount = scenario === "supplied" ? 3 : scenario === "large" ? 12 : 0;
  const resources: Resource[] = [];
  for (let i = 0; i < requestCount + frameCount; i++) {
    const kind = i < requestCount ? "request" : "embed";
    const groupIndex = scenario === "supplied" ? i < 19 ? 0 : i < 26 ? 1 : i < 39 ? 2 : i < 45 ? 3 : i < 48 ? 4 : 5 : i % Math.max(1, names.length);
    const service = kind === "embed" ? services[2]! : i < knownCount ? services[groupIndex]! : unknown;
    const domain = service === unknown ? "unidentified.example.test" : `integration-${groupIndex + 1}.example.test`;
    const name = `https://${domain}/layout-resource-${i}.${kind === "embed" ? "html" : "js"}`;
    const key = `layout-${i}`;
    const purpose = scenario === "supplied" ? i < 144 ? "unknown" : i < 193 ? "infrastructure" : "consent_management" : "unknown";
    const inventoryEvidence = scenario === "supplied" ? i < 46 ? "Review" : i < 120 ? "Unclassified" : "Contextual" : "Unclassified";
    const eventCount = kind === "embed" ? i === requestCount ? 5 : 4 : scenario === "supplied" ? i < 21 ? 5 : 4 : 1;
    const relationship = i < 111 ? "first_party" : "third_party";
    const row: Resource = { key, name, kind, context: service.context, pageIds: [pageId], purposes: [purpose], relationships: [relationship], eventCount, inventoryEvidence,
      occurrence: { id: key, identity: key, kind, label: name, vendor: service.context.identity?.vendor ?? null, domain, serviceId: null, purpose, resourceType: kind === "embed" ? "iframe" : "script", relationship, confidence: "Unknown", assessment: "Not assessed", eventCount, firstSeenMs: null, evidenceRefs: [], details: { fixture: true } },
      destinations: [], destinationAssessedCount: kind === "request" ? eventCount : 0, destinationMissingCount: kind === "request" ? eventCount : 0, destinationsTruncated: false,
    };
    resources.push(row); service.resources.push(row); service.purposes = [...new Set([...service.purposes, purpose])];
  }
  if (unknown.resources.length) services.push(unknown);
  const breakdown = (value: (row: Resource) => string) => {
    const counts = new Map<string, number>();
    for (const row of resources) { const label = value(row); counts.set(label, (counts.get(label) ?? 0) + 1); }
    return [...counts].map(([label, count]) => ({ label, count }));
  };
  const inventory: SinglePageResourceInventory = { resources, services, mix: { type: breakdown(row => row.kind), evidence: breakdown(row => row.inventoryEvidence), purpose: breakdown(row => row.purposes[0]!), relationship: breakdown(row => row.relationships[0]!) } };
  const counts = (kind: string) => Object.fromEntries([["nonEssential", "Non-essential"], ["review", "Review"], ["unclassified", "Unclassified"], ["contextual", "Contextual"], ["essential", "Essential"]].map(([key, label]) => [key, resources.filter(row => row.kind === kind && row.inventoryEvidence === label).reduce((sum, row) => sum + row.eventCount, 0)])) as NonNullable<ReportInventoryMetric["counts"]>;
  const metrics: ReportInventoryMetric[] = [
    { label: "Cookies & storage", value: 0, counts: counts("cookie") },
    { label: "Network requests", value: resources.filter(row => row.kind === "request").reduce((sum, row) => sum + row.eventCount, 0), overview: buildNetworkInventoryOverview(services), counts: counts("request") },
    { label: "Embedded frames", value: resources.filter(row => row.kind === "embed").reduce((sum, row) => sum + row.eventCount, 0), counts: counts("embed") },
  ];
  return { inventory, metrics };
}
