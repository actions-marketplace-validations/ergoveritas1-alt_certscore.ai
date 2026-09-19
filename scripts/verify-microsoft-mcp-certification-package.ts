import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import sharp from "sharp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function main() {
const releaseDir = resolve(process.argv[2] ?? "outputs/microsoft-mcp-certification-v2/v1.0.3");
const packageDir = join(releaseDir, "package");
const manifest = JSON.parse(await readFile(join(packageDir, "manifest.json"), "utf8"));
const toolFile = JSON.parse(await readFile(join(packageDir, "mcptools.json"), "utf8"));
const archive = join(releaseDir, `certscore-microsoft-mcp-package-v${manifest.version}.zip`);
const expectedFiles = ["color.png", "intro.md", "manifest.json", "mcptools.json", "outline.png"];
const actualFiles = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n").sort();
assert.deepEqual(actualFiles, expectedFiles);
execFileSync("unzip", ["-t", archive], { stdio: "pipe" });
for (const file of expectedFiles) {
  assert.deepEqual(execFileSync("unzip", ["-p", archive, file]), await readFile(join(packageDir, file)));
}
assert.equal(manifest.name.short, "CertScore Web Privacy Scanner");
assert.equal(manifest.name.full, manifest.name.short);
assert.equal(manifest.agentConnectors[0].displayName, manifest.name.short);
assert.equal(manifest.id, "b971ee8e-f595-4a87-8b18-a401171f821d");
assert.equal(manifest.developer.websiteUrl, "https://certscore.ai/");
assert(!/Microsoft|Teams/i.test(manifest.name.full));
assert(manifest.description.short.length <= 80);
assert(manifest.name.short.length <= 30);
assert(manifest.description.full.length <= 4000);
assert((await readFile(join(releaseDir, "partner-center-listing.md"), "utf8")).includes(manifest.description.full));
const remote = manifest.agentConnectors[0].toolSource.remoteMcpServer;
assert.equal(remote.mcpServerUrl, "https://mcp.certscore.ai/mcp/microsoft");
assert.equal(remote.authorization.type, "AzureKeyVault");
assert.equal(remote.authorization.referenceId, "https://cs-msft-mcp-kv-7150890.vault.azure.net/");
assert.equal(manifest.manifestVersion, "devPreview");
const iconChecks = [];
for (const [file, size] of [["color.png", 192], ["outline.png", 32]] as const) {
  const { data, info } = await sharp(join(packageDir, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, size);
  assert.equal(info.height, size);
  if (file === "outline.png") {
    let opaque = 0;
    let transparent = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) transparent++;
      else {
        opaque++;
        assert.equal(data[i], 255);
        assert.equal(data[i + 1], 255);
        assert.equal(data[i + 2], 255);
      }
    }
    assert(opaque > 0 && transparent > 0);
  } else {
    for (let i = 3; i < data.length; i += 4) assert.equal(data[i], 255);
  }
  iconChecks.push({ file, width: size, height: size, pixelChecks: "passed" });
}
const schemaResponse = await fetch(manifest.$schema, { signal: AbortSignal.timeout(25_000) });
assert.equal(schemaResponse.status, 200);
const schema = await schemaResponse.text();
const schemaPath = join(releaseDir, "validation-schema.json");
await writeFile(schemaPath, schema);
// Microsoft's draft-04 schema uses JavaScript Unicode regex syntax. Use a
// draft-04 JavaScript validator without rewriting or weakening its constraints.
const schemaRequire = createRequire(join(resolve(process.env.CERTSCORE_SCHEMA_MODULES ?? "."), "package.json"));
const AjvDraft04 = schemaRequire("ajv-draft-04");
const addFormats = schemaRequire("ajv-formats");
const validator = new AjvDraft04({ strict: false, allErrors: true });
addFormats(validator);
const validate = validator.compile(JSON.parse(schema));
assert(validate(manifest), JSON.stringify(validate.errors));

const links = await Promise.all([
  manifest.developer.websiteUrl, manifest.developer.privacyUrl, manifest.developer.termsOfUseUrl,
  "https://certscore.ai/contact-sales", "https://certscore.ai/developers/mcp", "https://certscore.ai/developers/reference"
].map(async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  assert.equal(new URL(response.url).pathname, new URL(url).pathname, `${url}: unexpected redirect`);
  const body = await response.text();
  assert(body.length > 100, `${url}: empty content`);
  return { url, finalUrl: response.url, status: response.status };
}));
const health = await fetch("https://mcp.certscore.ai/healthz", { signal: AbortSignal.timeout(20_000) });
assert.equal(health.status, 200);
const healthBody = await health.json();
const unauthorized = await fetch(remote.mcpServerUrl, { signal: AbortSignal.timeout(20_000) });
assert.equal(unauthorized.status, 401);
const client = new Client({ name: "certscore-package-readonly-verification", version: manifest.version });
let liveToolNames: string[];
try {
  await client.connect(new StreamableHTTPClientTransport(new URL("https://mcp.certscore.ai/mcp/light")));
  const live = await client.listTools();
  assert.deepEqual(live.tools, toolFile.tools);
  liveToolNames = live.tools.map((tool) => tool.name);
} finally {
  await client.close();
}
const report = {
  verifiedAt: new Date().toISOString(),
  version: manifest.version,
  archive: archive.split("/").pop(),
  sha256: createHash("sha256").update(await readFile(archive)).digest("hex"),
  files: actualFiles,
  schema: { url: manifest.$schema, dialect: "draft-04", status: "passed", sha256: createHash("sha256").update(schema).digest("hex") },
  namingAndListingParity: "passed",
  icons: iconChecks,
  links,
  health: { status: health.status, serviceStatus: healthBody.status, version: healthBody.version },
  microsoftEndpointWithoutToken: unauthorized.status,
  publicLightToolParity: { status: "passed", tools: liveToolNames },
  scope: "Read-only diagnostics. No scan or authenticated Microsoft connection was performed. Public Light tool parity is not proof of Microsoft authentication or Copilot Studio compatibility.",
  remaining: ["Microsoft grant-type confirmation", "Authenticated end-to-end Microsoft/Copilot Studio test", "Actual Copilot Studio screenshots and video", "Partner Center draft updates", "Publisher Attestation"]
};
await writeFile(join(releaseDir, "verification.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
