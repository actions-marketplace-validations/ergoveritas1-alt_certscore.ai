import { execFile } from "node:child_process";
import { promisify } from "node:util";

// Read-only drift checks. No keys, subscriptions, scans, messages or AWS resources
// are created. This is not a substitute for the buyer lifecycle acceptance tests.
const exec = promisify(execFile);
const account = "199536052647";
const product = "prod-eagvxckgntmxc";
const code = "a3p2vfccdufqnuhyn5r8lsx0q";
const offer = "offer-jvsx7w2hpkafo";
const topic = `arn:aws:sns:us-east-1:${account}:certscore-marketplace-light-events`;
const queue = `https://sqs.us-east-1.amazonaws.com/${account}/certscore-marketplace-light-events-dlq`;
const endpoint = "https://mcp.certscore.ai/mcp/marketplace/light";
const registration = "https://certscore.ai/api/marketplace/light/register";
const setup = "https://certscore.ai/marketplace/light";
const results: { check: string; passed: boolean; detail?: string }[] = [];
function check(name: string, passed: boolean, detail?: string) {
  results.push({ check: name, passed, ...(detail ? { detail } : {}) });
}
async function aws<T>(args: string[]): Promise<T> {
  try {
    const { stdout } = await exec("aws", [...args, "--region", "us-east-1", "--output", "json", "--no-cli-pager"], { timeout: 30_000, maxBuffer: 2_000_000 });
    return JSON.parse(stdout) as T;
  } catch {
    // Do not print raw catalog documents, signed legal URLs, or CLI credentials.
    throw new Error(`Read-only AWS check failed: ${args.slice(0, 2).join(" ")}`);
  }
}
type Delivery = { Type: string; FulfillmentUrl: string; QuickLaunchEnabled: boolean; CompatibleServices?: unknown[] | null; ApiType: string; Endpoints?: { EndpointUrl: string; AuthorizationTypes?: string[]; IntegrationProtocols?: { UsageInstructions?: string }[] }[] };
type Product = { Description: { ProductCode: string; Visibility: string; ProductState: string }; Versions: { DeliveryOptions: Delivery[] }[] };
type Offer = { ProductId: string; State: string; Terms: { Type: string; RateCards?: { RateCard: { Price: string }[] }[] }[] };

async function checkCatalog() {
  const [listing, pricing] = await Promise.all([
    aws<{ DetailsDocument: Product }>(["marketplace-catalog", "describe-entity", "--catalog", "AWSMarketplace", "--entity-id", product]),
    aws<{ DetailsDocument: Offer }>(["marketplace-catalog", "describe-entity", "--catalog", "AWSMarketplace", "--entity-id", offer]),
  ]);
  const p = listing.DetailsDocument;
  check("product identity and active state", p.Description.ProductCode === code && p.Description.ProductState === "Active");
  check("listing remains Limited for acceptance testing", p.Description.Visibility === "Limited", p.Description.Visibility);
  const deliveries = p.Versions.flatMap(version => version.DeliveryOptions);
  check("single expected Marketplace delivery option", deliveries.length === 1);
  const delivery = deliveries[0];
  check("website fulfillment and MCP endpoint", delivery?.Type === "ApiRegistration" && delivery.FulfillmentUrl === registration && delivery.ApiType === "MCP_SERVER" && delivery.Endpoints?.length === 1 && delivery.Endpoints[0].EndpointUrl === endpoint);
  check("API-key authorization", delivery?.Endpoints?.[0]?.AuthorizationTypes?.length === 1 && delivery.Endpoints[0].AuthorizationTypes[0] === "API_KEY");
  check("Quick Launch and AgentCore disabled", delivery?.QuickLaunchEnabled === false && !delivery.CompatibleServices?.length);
  const instructions = delivery?.Endpoints?.[0]?.IntegrationProtocols?.map(protocol => protocol.UsageInstructions ?? "").join("\n") ?? "";
  check("usage instructions match authenticated setup", instructions.includes(endpoint) && instructions.includes(setup) && instructions.includes("Authorization: Bearer") && !/no (?:account|api key).*required/i.test(instructions));
  const o = pricing.DetailsDocument;
  const terms = o.Terms.filter(term => /PricingTerm$/.test(term.Type));
  const rates = terms.flatMap(term => term.RateCards?.flatMap(card => card.RateCard) ?? []);
  check("released zero-price offer", o.ProductId === product && o.State === "Released" && terms.length === 1 && terms[0].Type === "UsageBasedPricingTerm" && rates.length > 0 && rates.every(rate => rate.Price.trim() !== "" && Number(rate.Price) === 0));
}

async function checkDelivery() {
  const [rule, targets, subscriptions, dlq] = await Promise.all([
    aws<{ State: string; EventPattern: string }>(["events", "describe-rule", "--name", "certscore-marketplace-light-licenses"]),
    aws<{ Targets: { Arn: string }[] }>(["events", "list-targets-by-rule", "--rule", "certscore-marketplace-light-licenses"]),
    aws<{ Subscriptions: { Protocol: string; Endpoint: string; SubscriptionArn: string }[] }>(["sns", "list-subscriptions-by-topic", "--topic-arn", topic]),
    aws<{ Attributes: Record<string, string> }>(["sqs", "get-queue-attributes", "--queue-url", queue, "--attribute-names", "ApproximateNumberOfMessages", "ApproximateNumberOfMessagesNotVisible", "ApproximateNumberOfMessagesDelayed"]),
  ]);
  const pattern = JSON.parse(rule.EventPattern);
  const exact = (actual: unknown, expected: string[]) => Array.isArray(actual) && actual.length === expected.length && expected.every(item => actual.includes(item));
  check("enabled license lifecycle rule with exact product scope", rule.State === "ENABLED" && exact(pattern.source, ["aws.agreement-marketplace"]) && exact(pattern.account, [account]) && exact(pattern["detail-type"], ["License Updated - Manufacturer", "License Deprovisioned - Manufacturer"]) && exact(pattern.detail?.product?.id, [product]) && exact(pattern.detail?.product?.code, [code]));
  check("lifecycle target is the signed delivery topic", targets.Targets.length === 1 && targets.Targets[0].Arn === topic);
  const subscription = subscriptions.Subscriptions.find(item => item.Protocol === "https" && item.Endpoint === "https://certscore.ai/api/marketplace/light/events");
  check("HTTPS lifecycle subscription confirmed", Boolean(subscription?.SubscriptionArn.startsWith(`${topic}:`)));
  if (subscription?.SubscriptionArn.startsWith(`${topic}:`)) {
    const settings = await aws<{ Attributes: Record<string, string> }>(["sns", "get-subscription-attributes", "--subscription-arn", subscription.SubscriptionArn]);
    const policy = JSON.parse(settings.Attributes.RedrivePolicy ?? "{}");
    check("subscription dead-letter recovery configured", policy.deadLetterTargetArn === `arn:aws:sqs:us-east-1:${account}:certscore-marketplace-light-events-dlq`);
  }
  const counts = ["ApproximateNumberOfMessages", "ApproximateNumberOfMessagesNotVisible", "ApproximateNumberOfMessagesDelayed"].map(name => dlq.Attributes[name]);
  check("delivery dead-letter queue is empty", counts.every(value => value === "0"), counts.join(" / "));
}

async function checkPublicRoutes() {
  const [page, handoff] = await Promise.all([
    fetch(setup, { signal: AbortSignal.timeout(15_000) }),
    fetch(registration, { redirect: "manual", signal: AbortSignal.timeout(15_000) }),
  ]);
  check("setup page reachable", page.status === 200, String(page.status));
  check("registration GET safely returns to setup", [302, 303, 307, 308].includes(handoff.status) && new URL(handoff.headers.get("location") ?? "/", registration).href === setup);
  await Promise.all([false, true].map(async invalidKey => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(invalidKey ? { Authorization: `Bearer cs_mp_light_${"A".repeat(43)}` } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "certscore-readiness", version: "1" } } }),
      signal: AbortSignal.timeout(15_000),
    });
    check(invalidKey ? "invalid key denied at MCP authentication" : "missing key denied at MCP authentication", response.status === 401, String(response.status));
  }));
}

async function main() {
  const identity = await aws<{ Account: string }>(["sts", "get-caller-identity"]);
  if (identity.Account !== account) throw new Error("Use the CertScore seller account for these read-only checks.");
  const checks = await Promise.allSettled([checkCatalog(), checkDelivery(), checkPublicRoutes()]);
  checks.forEach((result, index) => {
    if (result.status === "rejected") check(["catalog inspection", "event delivery inspection", "public route inspection"][index], false, result.reason instanceof Error ? result.reason.message : "Check unavailable");
  });
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), product, checks: results, acceptanceStillRequired: ["real cancellation and re-subscription", "fresh scan pending-to-terminal lifecycle", "independent buyer account", "assistant application compatibility", "missed-event recovery and alerting"] }, null, 2));
  if (results.some(result => !result.passed)) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Readiness check failed"); process.exitCode = 1; });
