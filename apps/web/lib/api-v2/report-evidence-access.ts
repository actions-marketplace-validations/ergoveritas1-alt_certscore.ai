export class ReportEvidenceAccessError extends Error {}

/** Scope the read before accessing any cached projection. Never query without an organization. */
export async function loadAuthorizedReportEvidence<T>(input: {
  scanId: string;
  bearer: { provided: boolean; token: string | null };
  validate: (token: string, scopes: ["pulse:read"]) => Promise<{ ok: boolean; key?: { organizationId: string | null } }>;
  loadOwned: (scope: { scanId: string; organizationId: string }) => Promise<T | null>;
  loadPublic: (scope: { scanId: string }) => Promise<T | null>;
}): Promise<T | null> {
  if (!input.bearer.provided) return input.loadPublic({ scanId: input.scanId });
  const auth = input.bearer.token ? await input.validate(input.bearer.token, ["pulse:read"]) : null;
  if (!auth?.ok || !auth.key?.organizationId) throw new ReportEvidenceAccessError("A valid workspace credential with scan:read is required. Reconnect to authorize read access.");
  return await input.loadOwned({ scanId: input.scanId, organizationId: auth.key.organizationId })
    ?? await input.loadPublic({ scanId: input.scanId });
}
