// Public setup copy only. Never include credentials or customer data here.
export const MARKETPLACE_LIGHT_LISTING = "https://aws.amazon.com/marketplace/pp/prodview-o5zatqmzjhzpu";
export const marketplaceScanFocus = {
  overview: { label: "Privacy overview", request: "Summarize the main privacy risk signals and the next checks a human should make." },
  tracking: { label: "Cookies & trackers", request: "Explain the observed cookies, trackers and third-party activity, including what was observed before consent." },
  consent: { label: "Consent controls", request: "Review the observed consent controls. Separate visible controls, completed interactions and confirmed consent decisions." },
  policy: { label: "Privacy disclosures", request: "Review the observed privacy-policy disclosures and supporting evidence. Explain what could not be verified." },
} as const;
export type MarketplaceScanFocus = keyof typeof marketplaceScanFocus;

export function buildMarketplaceScanPrompt(input: string, focus: MarketplaceScanFocus): string {
  const raw = input.trim();
  if (!raw || /[\s<>"`]/.test(raw)) throw new Error("Enter a public website, such as example.com.");
  let url: URL;
  try { url = new URL(raw.includes("://") ? raw : `https://${raw}`); }
  catch { throw new Error("Enter a valid public website address."); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port
    || !url.hostname.includes(".") || /(?:^|\.)(?:localhost|local|internal)$/.test(url.hostname)
    || /^\[|^[\d.]+$/.test(url.hostname)) {
    throw new Error("Use a public website domain with HTTP or HTTPS, without a login or custom port.");
  }
  if (url.search || url.hash) throw new Error("Remove query parameters and the # fragment. Use a public page without personal data or access tokens.");
  return `Use CertScore to scan ${url.href}. ${marketplaceScanFocus[focus].request}\n\nStart with certscore_scan_site. If a scan ID is returned and the scan is pending, check certscore_get_scan_status at the returned interval until terminal. If a retryable response has no scan ID, wait for its retry interval before retrying the scan. Retrieve certscore_get_scan_bundle and follow certscore_get_report_evidence_page pagination when needed. Include the report link, scan date, whether the result was reused, supporting evidence and coverage limitations. Do not present partial previews as final findings or automated observations as legal conclusions.`;
}
