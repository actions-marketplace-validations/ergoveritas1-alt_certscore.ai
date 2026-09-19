import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import sharp from "sharp";

const outputRoot = resolve("outputs/microsoft-mcp-certification-v2");
const packageVersion = "1.0.3";
const releaseDir = join(outputRoot, `v${packageVersion}`);
const packageDir = join(releaseDir, "package");
const zipPath = join(releaseDir, `certscore-microsoft-mcp-package-v${packageVersion}.zip`);
const appName = "CertScore Web Privacy Scanner";
const productSummary = `${appName} offers free, usage-limited scanning of public websites and evidence-backed review of cookies, trackers, CMPs and consent controls, privacy-policy and disclosure signals, observable form and third-party embed activity, and HTTPS/TLS.`;
const requirements = "Requirements: Access to Microsoft Copilot Studio and permission to add and use the connector in your organization's environment are required. Your Microsoft plan and administrator policies govern availability. This connector uses publisher-configured Microsoft Entra application authentication. No separate CertScore account, paid CertScore subscription, or personal CertScore API key is required. Scan and retrieval limits apply; see the documentation for current limits and retry guidance. Only publicly accessible websites are supported; authenticated pages and private-network targets are excluded.";
const supportLinks = "Get started and help: https://certscore.ai/developers/mcp\nUsage limits and API documentation: https://certscore.ai/developers/reference\nContact us: https://certscore.ai/contact-sales\nEmail support: support@certscore.ai\nWebsite: https://certscore.ai/\nPrivacy: https://certscore.ai/privacy\nTerms: https://certscore.ai/terms";
const fullDescription = `${productSummary}\n\nBuilt for developers and agencies reviewing websites for GDPR/ePrivacy and CCPA concerns. Use its MCP tools from a connected agent to request or reuse a scan, check progress, retrieve a report, and inspect paginated supporting evidence. Review observed signals and coverage limitations before deciding your next steps.\n\nConsent-choice observations are available only when the scan retains eligible evidence. A completed control interaction does not by itself establish consent or refusal registration. Results are review aids, not legal advice, certification, or a compliance determination.\n\n${requirements}\n\n${supportLinks}`;
const templateKeyVaultUri = "https://REPLACE-WITH-CERTSCORE-MCP-KEY-VAULT.vault.azure.net/";
const keyVaultUri = process.env.CERTSCORE_MICROSOFT_KEY_VAULT_URI?.trim() || templateKeyVaultUri;

if (keyVaultUri !== templateKeyVaultUri && !/^https:\/\/[a-z0-9-]+\.vault\.azure\.net\/$/.test(keyVaultUri)) {
  throw new Error("CERTSCORE_MICROSOFT_KEY_VAULT_URI must be an exact https://<name>.vault.azure.net/ URI.");
}

async function lightTools() {
  const { createCertScoreMcpServer } = await import("../packages/certscore-mcp/dist/server.js");
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createCertScoreMcpServer({ toolProfile: "light" });
  const client = new Client({ name: "certscore-microsoft-package-builder", version: packageVersion });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return (await client.listTools()).tools;
  } finally {
    await client.close();
    await server.close();
  }
}

const manifest = {
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/vDevPreview/MicrosoftTeams.schema.json",
  manifestVersion: "devPreview",
  version: packageVersion,
  id: "b971ee8e-f595-4a87-8b18-a401171f821d",
  developer: {
    name: "CertScore.ai",
    mpnId: "7150890",
    websiteUrl: "https://certscore.ai/",
    privacyUrl: "https://certscore.ai/privacy",
    termsOfUseUrl: "https://certscore.ai/terms",
    contactInfo: {
      defaultSupport: {
        userEmailsForChatSupport: ["support@certscore.ai"],
        emailsForEmailSupport: ["support@certscore.ai"]
      }
    }
  },
  name: {
    short: appName,
    full: appName
  },
  description: {
    short: "Free, usage-limited website privacy scans with findings and supporting evidence.",
    full: fullDescription
  },
  agentConnectors: [{
    id: "certscore-microsoft-mcp",
    displayName: appName,
    description: "Scan or reuse a public-website assessment, check status, retrieve its bounded report bundle, and page through retained report evidence when needed.",
    toolSource: {
      remoteMcpServer: {
        mcpServerUrl: "https://mcp.certscore.ai/mcp/microsoft",
        mcpToolDescription: { file: "mcptools.json" },
        authorization: {
          type: "AzureKeyVault",
          referenceId: keyVaultUri
        }
      }
    }
  }],
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#020617"
};

const intro = `# ${appName}

${productSummary}

## Requirements and getting started

${requirements}

This is the Microsoft-authenticated edition of CertScore MCP Light. Its endpoint is https://mcp.certscore.ai/mcp/microsoft. The submitted configuration references Azure Key Vault for publisher-managed Entra client-credentials authentication. An administrator or the Microsoft connector integration must configure the connection before the tools can be used. End users do not supply CertScore credentials. Direct interactive OAuth sign-in or dynamic client registration at this endpoint is not supported. If your client prompts you to register an OAuth application, contact support for the appropriate connection configuration.

The general MCP setup page also describes other CertScore connection types; this package specifically uses the Microsoft endpoint and authentication above. The public Light endpoint and workspace OAuth endpoint are separate connection types.

## Four-tool lifecycle

1. Use \`certscore_scan_site\` to request a scan or reuse an eligible recent completed scan. Keep the stable \`scanId\` returned by the tool. The default \`freshness=latest\` avoids unnecessary new scans; use \`refresh\` only when a fresh run is explicitly required.
2. Use \`certscore_get_scan_status\` with that \`scanId\` while the scan is queued, running, or finalizing. Follow the returned retry guidance and stop at a terminal state.
3. For \`completed\` or \`completed_limited\`, use \`certscore_get_scan_bundle\` to retrieve the bounded canonical findings, evidence summaries and references, provenance, coverage limitations, score metadata, and public report URL.
4. When a reviewer needs the fuller retained report projection, use \`certscore_get_report_evidence_page\` with the same \`scanId\`. Continue with the returned cursor until pagination reports completion. Keep pages from the same snapshot together and preserve coverage limitations.

The Microsoft endpoint retains MCP Light's bounded anonymous-style scan and read quotas. Eligible recent-result reuse does not consume a new-scan allowance. Current automated-access policy and retry guidance are published at https://certscore.ai/developers/reference. For higher-volume use, contact support@certscore.ai.

## Public reports and evidence boundaries

Usable completed results include a public CertScore report URL. Returned content is bounded and public-safe: it excludes raw cookie values, raw request or response bodies, sensitive payloads, full DOM content, and unredacted query values. Findings and checklist rows come from CertScore's canonical evidence, concern-policy, and projection pipeline.

Results are evidence-backed automated observations of public websites for human and agentic review. They are not legal advice, certification, or a compliance determination. Missing or limited evidence is not proof of compliance, and observed review lenses are not legal conclusions.

## Known issues and limitations

- Scans cover observable public-web behavior from the selected execution region and time; site behavior can vary by location, session, account state, personalization, and later changes.
- \`completed_limited\` is usable but has explicit coverage limitations. Read those limitations before interpreting findings.
- Report-evidence pages are bounded. Follow the returned cursor to retrieve the complete available projection; a single page is not the complete report.
- Consent-choice observations require an eligible, deterministically resolved first-layer control and retained evidence. Control activation, completed observation, and confirmed consent/refusal are distinct outcomes. Preserve the report's exact outcome and coverage limitations.
- An unconfirmed action is not proof of consent or refusal. Separately verified after-click tracking may still produce a review finding. Missing or unverifiable evidence does not create a finding.
- Bounded observations do not establish behavior outside the measured window.
- Missing consent-action evidence does not establish Accept, Reject, Decline, or deeper preference behavior.
- Do not extrapolate observed vendors, embeds, requests, cookies, fingerprinting, tracking, or processing beyond what the retained evidence supports.
- Authentication is service-to-service. Microsoft Entra or Azure Key Vault configuration failures require administrator or publisher remediation rather than end-user CertScore login.

## Get started, support, and policies

${supportLinks}
`;

// Derive monochrome artwork from the actual brand geometry, including its pixels
// and checkmark, rather than drawing a second, visually different shield.
async function brandIcons() {
  const brand = await readFile("apps/web/public/certscore-mark-dark.svg", "utf8");
  const group = brand.match(/<g\b[^>]*>[\s\S]*?<\/g>/)?.[0];
  const check = group?.match(/<path\b[^>]*stroke="#fff"[^>]*\/>/)?.[0];
  if (!group || !check) throw new Error("Canonical shield/checkmark geometry is missing.");
  const white = group.replace(check, "")
    .replace(/fill="[^"]*"/g, 'fill="#fff"')
    .replace(/\sopacity="[^"]*"/g, "");
  const cutout = check.replace('stroke="#fff"', 'stroke="#000"');
  // Tight, proportion-preserving symbol bounds; no decorative outline padding.
  const outline = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.8 7.5 53.6 53.6"><defs><mask id="check" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><g transform="translate(1 0)">${cutout}</g></mask></defs><g mask="url(#check)">${white}</g></svg>`;
  await Promise.all([
    sharp(Buffer.from(brand)).resize(120, 120)
      .extend({ top: 36, bottom: 36, left: 36, right: 36, background: "#020617" })
      .flatten({ background: "#020617" }).png().toFile(join(packageDir, "color.png")),
    sharp(Buffer.from(outline)).resize(32, 32).png().toFile(join(packageDir, "outline.png"))
  ]);
  await sharp(join(packageDir, "color.png")).resize(300, 300).png()
    .toFile(join(releaseDir, "partner-center-icon-300.png"));
}

async function main() {
  await rm(packageDir, { force: true, recursive: true });
  await rm(zipPath, { force: true });
  await mkdir(packageDir, { recursive: true });
  const tools = await lightTools();
  await Promise.all([
    writeFile(join(packageDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    writeFile(join(packageDir, "mcptools.json"), `${JSON.stringify({ tools }, null, 2)}\n`, "utf8"),
    writeFile(join(packageDir, "intro.md"), intro, "utf8"),
    writeFile(join(releaseDir, "partner-center-listing.md"), `# Partner Center listing - ${packageVersion}\n\nApply these fields to the draft listing after the concierge team's instructions; this file does not update Partner Center.\n\n## Title\n\n${appName}\n\n## Short description\n\n${manifest.description.short}\n\n## Long description\n\n${fullDescription}\n\n## Assets\n\nUse partner-center-icon-300.png for the listing icon and the package color.png / outline.png for the app. Replace the current website-only screenshots and video with genuine Copilot Studio captures before marking issues 7, 8, and 10 resolved.\n`, "utf8"),
    brandIcons()
  ]);

  const packageTimestamp = new Date("2026-09-18T00:00:00.000Z");
  await Promise.all(["manifest.json", "mcptools.json", "intro.md", "color.png", "outline.png"]
    .map((name) => utimes(join(packageDir, name), packageTimestamp, packageTimestamp)));

  execFileSync("zip", ["-X", "-q", zipPath, "manifest.json", "mcptools.json", "intro.md", "color.png", "outline.png"], {
    cwd: packageDir,
    env: { ...process.env, TZ: "UTC" }
  });
  console.log(JSON.stringify({ keyVaultTemplate: keyVaultUri === templateKeyVaultUri, releaseDir, packageDir, toolCount: tools.length, zipPath }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
