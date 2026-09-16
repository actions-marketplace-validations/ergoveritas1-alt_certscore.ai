import assert from "node:assert/strict";
import test from "node:test";
import { buildNetworkInventoryOverview } from "./network-inventory-overview";

test("network overview deduplicates identities, excludes unknown service buckets, and preserves source evidence", () => {
  const known = { identity: { product: "Example analytics" } };
  const unknown = { identity: null };
  const resources = [
    { key: "request:a", kind: "request", context: known, eventCount: 200, pageIds: ["one", "two"] },
    { key: "cookie:a", kind: "cookie", context: known, eventCount: 1, pageIds: ["one"] },
  ];
  const services = [
    { key: "known", context: known, resources },
    { key: "known", context: known, resources },
    { key: "unclassified", context: unknown, resources: [{ key: "request:b", kind: "request", context: unknown, eventCount: 537, pageIds: ["one"] }] },
    { key: "embed-only", context: known, resources: [{ key: "embed:a", kind: "embed", context: known, eventCount: 13, pageIds: ["one"] }] },
  ];
  const before = structuredClone(services);
  assert.deepEqual(buildNetworkInventoryOverview(services), { identifiedServices: 1, distinctResources: 2, unattributedResources: 1 });
  assert.deepEqual(services, before);
  assert.deepEqual(buildNetworkInventoryOverview([]), { identifiedServices: 0, distinctResources: 0, unattributedResources: 0 });
});
