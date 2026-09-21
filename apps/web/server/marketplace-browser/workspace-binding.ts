// A global selection cookie must not silently move a stale form into another workspace.
export function browserWorkspaceMatches(context: { marketplaceBrowser?: boolean; organization: { id: string } }, requested: unknown) {
  return context.marketplaceBrowser === true && typeof requested === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requested)
    && requested === context.organization.id;
}
