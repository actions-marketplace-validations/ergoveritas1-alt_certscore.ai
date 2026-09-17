import { resolveCanonicalVendor, resolveCanonicalVendorLabel } from "@certscore/vendor-resolver";

/** Labels preserve their specificity; observed URLs use the single-resource registry. */
export function canonicalEvidenceVendorName(value: string): string | null {
  const label = value.trim();
  if (!label || /cloudflare/i.test(label)) return null;
  if (/^https?:\/\//i.test(label)) {
    try {
      const url = new URL(label);
      const result = resolveCanonicalVendor({ type: "request", url: label, hostname: url.hostname, matchSource: "network_request" });
      return result.observation?.product ?? url.hostname;
    } catch { return null; }
  }
  const cookie = label.startsWith("_") ? resolveCanonicalVendor({ type: "cookie", cookieName: label, matchSource: "cookie_name" }).observation : null;
  return cookie?.product ?? resolveCanonicalVendorLabel(label)?.product ?? label;
}
