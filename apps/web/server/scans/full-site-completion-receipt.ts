/** A retry may acknowledge only the exact artifact already verified and persisted. */
export function matchesFullSiteCompletionReceipt(
  receipt: unknown,
  input: { sha256?: string; sizeBytes?: number; evidenceSizeBytes?: number },
) {
  if (!receipt || typeof receipt !== "object") return false;
  const saved = receipt as Record<string, unknown>;
  return typeof input.sha256 === "string" && /^[a-f0-9]{64}$/.test(input.sha256) &&
    Number.isInteger(input.sizeBytes) && input.sizeBytes! > 0 &&
    Number.isInteger(input.evidenceSizeBytes) && input.evidenceSizeBytes! > 0 &&
    saved.sha256 === input.sha256 && saved.sizeBytes === input.sizeBytes &&
    saved.evidenceSizeBytes === input.evidenceSizeBytes;
}
