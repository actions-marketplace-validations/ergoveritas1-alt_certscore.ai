import { decodeCommonHtmlEntities, type PolicySurfaceObservation } from "@certscore/contracts";
import { KNOWN_CMP_REGISTRY, isKnownCmpInfrastructureUrl } from "@website-signal-risk-scanner/shared";
import { getRegistrableDomainFromUrl } from "./domain-utils.js";

/** Discovery hints only. Ownership and document substance are evaluated downstream. */
export type CmpPolicyProvenance = NonNullable<PolicySurfaceObservation["cmpDiscovery"]>[number];
export type CmpPolicyReference = { url: string; provenance: CmpPolicyProvenance };
export const CMP_POLICY_MAX_HTML_CHARS = 500_000;
const MAX_CONFIG_CHARS = 64_000;
const MAX_CONFIG_REFERENCES = 4;
const PROVIDERS = new Set(["OneTrust", "Cookiebot", "TrustArc", "Didomi", "Quantcast Choice", "Usercentrics", "Termly", "Transcend"]);
export const CMP_POLICY_SCOPES = KNOWN_CMP_REGISTRY.filter(cmp => PROVIDERS.has(cmp.canonicalName))
  .map(cmp => ({ provider: cmp.canonicalName, selectors: cmp.domSelectors ?? [] }));
export const CMP_VENDOR_SCOPE_PATTERN = /(?:^|[\s_-])(?:vendors?|partners?|gvl)(?:$|[\s_-])|vendorlist|partnerlist/i;

export function cmpPolicyProvenance(source: "cmp_dom" | "cmp_config", cmpProvider: string, sourcePageUrl: string, sourceLocator: string): CmpPolicyProvenance {
  return { contractVersion: "cmp_policy_discovery.v1", source, cmpProvider, sourcePageUrl: sourcePageUrl.slice(0, 500), sourceLocator: sourceLocator.slice(0, 200) };
}

export function isCmpProviderPolicy(url: string, targetUrl: string): boolean {
  try {
    return getRegistrableDomainFromUrl(url) !== getRegistrableDomainFromUrl(targetUrl) &&
      isKnownCmpInfrastructureUrl(url) &&
      /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:privacy(?:-policy|-notice)?|legal\/privacy|about\/privacy)(?:\/|$)/i.test(new URL(url).pathname);
  } catch { return false; }
}

function normalizeReference(raw: unknown, baseUrl: string): string | undefined {
  if (typeof raw !== "string" || raw.length > 2_000 || /[{}<>]/.test(raw)) return;
  try {
    const url = new URL(decodeCommonHtmlEntities(raw), baseUrl);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || isCmpProviderPolicy(url.href, baseUrl)) return;
    return url.href;
  } catch { return; }
}

/** Exact documented publisher path; never recurse into vendors or invoke getters/APIs. */
export function readDidomiPublisherPolicy(root: unknown = typeof window === "undefined" ? undefined : window): string | undefined {
  try {
    let current = root;
    for (const key of ["didomiConfig", "app", "privacyPolicyURL"]) {
      if (!current || typeof current !== "object") return;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (!descriptor || !("value" in descriptor)) return;
      current = descriptor.value;
    }
    return typeof current === "string" && current.length <= 2_000 ? current : undefined;
  } catch { return; }
}

export function didomiPolicyReference(raw: unknown, baseUrl: string): CmpPolicyReference[] {
  const url = normalizeReference(raw, baseUrl);
  return url ? [{ url, provenance: cmpPolicyProvenance("cmp_config", "Didomi", baseUrl, "window.didomiConfig.app.privacyPolicyURL") }] : [];
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  for (const match of tag.matchAll(/\s([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1]!.toLowerCase()] = decodeCommonHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}
function matchesScope(attrs: Record<string, string>, selector: string): boolean {
  if (/^#[\w-]+$/.test(selector)) return attrs.id === selector.slice(1);
  if (/^\.[\w-]+$/.test(selector)) return (attrs.class ?? "").split(/\s+/).includes(selector.slice(1));
  const match = /^\[([\w-]+)(?:\*=['"]([^'"]+)['"](?: (i))?)?\]$/.exec(selector);
  if (!match) return false;
  const value = attrs[match[1]!];
  if (value === undefined) return false;
  return match[2] === undefined || (match[3] ? value.toLowerCase().includes(match[2].toLowerCase()) : value.includes(match[2]));
}
export type CmpAnchorContext = { provider: string; vendor: boolean; locator: string };

/** One bounded pass over existing HTML, with raw script/style bodies kept out of DOM discovery. */
export function inspectCmpPolicyHtml(source: string, baseUrl: string): {
  anchors: Map<number, CmpAnchorContext>; anchorOffsets: Set<number>; configReferences: CmpPolicyReference[];
} {
  const html = source.slice(0, CMP_POLICY_MAX_HTML_CHARS);
  const anchors = new Map<number, CmpAnchorContext>();
  const anchorOffsets = new Set<number>();
  const configReferences: CmpPolicyReference[] = [];
  const stack: Array<{ tag: string; context?: CmpAnchorContext }> = [];
  const tokens = /<!--[\s\S]*?-->|<(\/)?([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  let token: RegExpExecArray | null;
  let count = 0;
  while ((token = tokens.exec(html)) && ++count <= 100_000) {
    if (!token[2]) continue;
    const tag = token[2].toLowerCase();
    if (token[1]) {
      const index = stack.map(item => item.tag).lastIndexOf(tag);
      if (index >= 0) stack.length = index;
      continue;
    }
    const attrs = attributes(token[0]);
    if (tag === "script" || tag === "style") {
      const endPattern = new RegExp(`</${tag}\\s*>`, "gi");
      endPattern.lastIndex = tokens.lastIndex;
      const end = endPattern.exec(html);
      const body = html.slice(tokens.lastIndex, end?.index ?? html.length);
      if (tag === "script" && configReferences.length < MAX_CONFIG_REFERENCES) {
        // Only JSON object assignments are parsed statically. JavaScript is never evaluated here.
        if (body.length <= MAX_CONFIG_CHARS) {
          const assignment = /^\s*(?:window\.)?didomiConfig\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(body);
          if (assignment) {
            try { configReferences.push(...didomiPolicyReference(readDidomiPublisherPolicy({ didomiConfig: JSON.parse(assignment[1]!) }), baseUrl)); } catch { /* non-JSON config uses existing browser readback */ }
          }
        }
        if (attrs.src) {
          try {
            const src = new URL(attrs.src, baseUrl);
            const declaredDomain = src.searchParams.get("domain");
            if (src.protocol === "https:" && src.hostname === "consent.trustarc.com" && src.pathname === "/notice" &&
                declaredDomain && getRegistrableDomainFromUrl(`https://${declaredDomain}/`) === getRegistrableDomainFromUrl(baseUrl)) {
              const url = normalizeReference(src.searchParams.get("privacypolicylink"), baseUrl);
              if (url) configReferences.push({ url, provenance: cmpPolicyProvenance("cmp_config", "TrustArc", baseUrl, "script[src=consent.trustarc.com/notice]@privacypolicylink") });
            }
          } catch { /* malformed configuration is not evidence */ }
        }
      }
      tokens.lastIndex = end ? endPattern.lastIndex : html.length;
      continue;
    }
    const inherited = stack.at(-1)?.context;
    const scope = CMP_POLICY_SCOPES.find(item => item.selectors.some(selector => matchesScope(attrs, selector)));
    const provider = inherited?.provider ?? scope?.provider;
    const context = provider ? {
      provider,
      vendor: inherited?.vendor === true || CMP_VENDOR_SCOPE_PATTERN.test([attrs.id, attrs.class, attrs["aria-label"], attrs["data-testid"]].filter(Boolean).join(" ")),
      locator: attrs.id ? `#${attrs.id}`.slice(0, 200) : inherited?.locator ?? tag,
    } : undefined;
    if (tag === "a") anchorOffsets.add(token.index);
    if (tag === "a" && context) anchors.set(token.index, context);
    if (!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag) && !/\/\s*>$/.test(token[0])) {
      if (stack.length >= 256) break;
      stack.push({ tag, context });
    }
  }
  return { anchors, anchorOffsets, configReferences: configReferences.slice(0, MAX_CONFIG_REFERENCES) };
}

export function mergeCmpPolicyProvenance(...groups: Array<PolicySurfaceObservation["cmpDiscovery"]>): PolicySurfaceObservation["cmpDiscovery"] {
  const seen = new Set<string>();
  const merged = groups.flatMap(group => group ?? []).filter(item => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 4);
  return merged.length ? merged : undefined;
}
