export type NetworkInventoryOverview = {
  identifiedServices: number;
  distinctResources: number;
  unattributedResources: number;
};

/** Summarize existing service/resource identities, never findings or risk.
 * The unclassified catch-all is not an identified service. Event repetition
 * and page membership remain on the source resources, outside this summary. */
export function buildNetworkInventoryOverview(services: readonly {
  key: string;
  context: { identity: unknown };
  resources: readonly { key: string; kind: string; context: { identity: unknown } }[];
}[]): NetworkInventoryOverview {
  const identified = new Set<string>();
  const resources = new Set<string>();
  const unattributed = new Set<string>();
  for (const service of services) {
    const requests = service.resources.filter(resource => resource.kind === "request");
    if (requests.length && service.context.identity) identified.add(service.key);
    for (const resource of requests) {
      resources.add(resource.key);
      if (!resource.context.identity) unattributed.add(resource.key);
    }
  }
  return { identifiedServices: identified.size, distinctResources: resources.size, unattributedResources: unattributed.size };
}
