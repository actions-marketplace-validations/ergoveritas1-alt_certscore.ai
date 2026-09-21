import Link from "next/link";
import { SiteHeader } from "../../../../components/layout/site-header";
import { SiteFooter } from "../../../../components/layout/site-footer";
import { MarketplaceClientGuide, MarketplaceCopy } from "../../../../components/settings/marketplace-light-guide";
import { buildMarketplaceScanPrompt, MARKETPLACE_LIGHT_LISTING } from "../../../../lib/marketplace-light";
import { MARKETPLACE_LIGHT_ENDPOINT } from "../../../../server/marketplace/config";

export const metadata = {
  title: "AWS Marketplace MCP Light quick start",
  description: "From your free AWS Marketplace subscription to a connected assistant and your first public website privacy report.",
  robots: { index: false, follow: true }
};

const link = "font-medium text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950";
const card = "scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8";
const steps = [
  ["subscribe", "Subscribe & sign in"],
  ["key", "Link & create a key"],
  ["connect", "Connect your assistant"],
  ["first-scan", "Run your first scan"],
  ["help", "Get help"],
  ["data", "Access & data"]
];
const tools = [
  ["certscore_scan_site", "Start a public website scan or reuse a recent result."],
  ["certscore_get_scan_status", "Check progress using the returned scan ID."],
  ["certscore_get_scan_bundle", "Retrieve the completed findings and report link."],
  ["certscore_get_report_evidence_page", "Read additional pages of supporting evidence."]
];
const scanPrompt = buildMarketplaceScanPrompt("https://example.com", "overview");

export default function MarketplaceLightGuidePage() {
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3">Skip to quick start</a>
    <SiteHeader wide={false} accountLink={{ href: "/marketplace/light#access", label: "My access" }} />
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link className={link} href="/marketplace/light">← Back to your scanning hub</Link>
      <header className="max-w-3xl py-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">AWS Marketplace · MCP Light</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">From setup to your first privacy report.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Connect once, then ask your assistant to scan public websites and explain the evidence. Return to your scanning hub whenever you need another prompt or a replacement key.</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">Free Marketplace access. A CertScore account and Marketplace API key are required. Shared usage limits apply; your assistant may have its own fees.</p>
      </header>
      <nav aria-label="Quick-start sections" className="mb-8 flex flex-wrap gap-2">
        {steps.map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-sky-800 hover:border-sky-400">{label}</a>)}
      </nav>
      <div className="space-y-6">
        <section className={card} aria-labelledby="before-heading">
          <h2 id="before-heading" className="text-xl font-semibold">Before you begin</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Use the AWS account that holds your subscription and a CertScore account you can sign in to.</li>
            <li>Your MCP client must support remote Streamable HTTP and a custom Authorization header or bearer token. An OAuth-only connector cannot connect to this API-key endpoint directly.</li>
            <li>Choose a public website. Reports are public; do not submit private links, access tokens or personal data.</li>
          </ul>
        </section>
        <section id="subscribe" className={card} aria-labelledby="subscribe-heading">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 1</p>
          <h2 id="subscribe-heading" className="mt-2 text-2xl font-semibold">Subscribe, then return through AWS</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-600">
            <li>Open <a className={link} href={MARKETPLACE_LIGHT_LISTING}>CertScore MCP Light in AWS Marketplace</a>, review the free offer and complete your subscription.</li>
            <li>Choose <strong>Set up your account</strong> in AWS Marketplace. This securely brings your subscription to CertScore.</li>
            <li>Sign in or create your CertScore account. Continue in the same browser so the AWS setup handoff is available when you return.</li>
          </ol>
          <p className="mt-4 text-sm leading-7 text-slate-600">Already subscribed? Start with <strong>Set up your account</strong> again. Opening the scanning hub alone does not import an AWS subscription. The CertScore handoff expires after 30 minutes; restarting it does not require another purchase.</p>
          <Link className={`${link} mt-4 inline-block`} href="/login?next=%2Fmarketplace%2Flight">Sign in and continue setup</Link>
        </section>
        <section id="key" className={card} aria-labelledby="key-heading">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 2</p>
          <h2 id="key-heading" className="mt-2 text-2xl font-semibold">Confirm your account and save your key</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-600">
            <li>Check the AWS account number and signed-in CertScore email. Only confirm a subscription you are authorized to link.</li>
            <li>Choose <strong>Confirm and link subscription</strong>. If activation is pending, use <strong>Check activation status</strong>. A key becomes available after AWS confirms activation.</li>
            <li>Choose <strong>Create API key</strong> and save it securely. The full key cannot be shown again after you leave the page.</li>
          </ol>
          <p className="mt-4 rounded-xl bg-sky-50 p-4 text-sm leading-6 text-sky-950">A created key is not yet a connected assistant. Add it to your client in the next step. You sign in here to manage access; MCP requests use your key without an interactive login for each scan.</p>
          <Link className={`${link} mt-4 inline-block`} href="/marketplace/light#access">Open your subscription and keys</Link>
        </section>
        <section id="connect" className={card} aria-labelledby="connect-heading">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 3</p>
          <h2 id="connect-heading" className="mb-5 mt-2 text-2xl font-semibold">Connect and check the tools</h2>
          <MarketplaceClientGuide endpoint={MARKETPLACE_LIGHT_ENDPOINT} />
          <dl className="mt-6 divide-y divide-slate-100">
            {tools.map(([name, description]) => <div key={name} className="py-3"><dt className="break-all font-mono text-sm font-semibold text-slate-800">{name}</dt><dd className="mt-1 text-sm leading-6 text-slate-600">{description}</dd></div>)}
          </dl>
        </section>
        <section id="first-scan" className={card} aria-labelledby="scan-heading">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 4</p>
          <h2 id="scan-heading" className="mt-2 text-2xl font-semibold">Ask your first question</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Copy this prompt into your connected assistant. Replace example.com with your chosen public website and approve the tool calls your client requests. Copying the prompt does not start a scan.</p>
          <blockquote className="my-4 whitespace-pre-wrap rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-7 text-slate-700">{scanPrompt}</blockquote>
          <MarketplaceCopy value={scanPrompt} label="Copy first-scan prompt" />
          <h3 className="mt-6 font-semibold">What a finished scan should give you</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>A completed result, its scan date and whether it was reused.</li>
            <li>Findings with evidence, coverage limitations and a public report link.</li>
            <li>Clear disclosure of any failed or incomplete capture. A partial preview is not the final report, and missing evidence is not proof of safety.</li>
          </ul>
          <p className="mt-4 text-sm leading-7 text-slate-600">Save the report link to revisit it. For another website or a follow-up question, return to the <Link className={link} href="/marketplace/light#scan">scan prompt builder</Link>. Light may reuse recent results and does not include scheduled monitoring or private workspace history.</p>
        </section>
        <section id="help" className={card} aria-labelledby="help-heading">
          <h2 id="help-heading" className="text-2xl font-semibold">Get back on track</h2>
          <div className="mt-5 divide-y divide-slate-100 text-sm leading-7 text-slate-600">
            {[
              ["No subscription appears after sign-in", "Use the same browser as your AWS handoff. In AWS Marketplace, open the subscribed product and choose Set up your account again. Check the CertScore email shown before linking. If the subscription was linked to a different CertScore account, sign in to that account or contact support."],
              ["Activation is still pending", "Choose Check activation status in the scanning hub. If it remains pending, contact support with the time you subscribed and your AWS account number. Do not repeatedly subscribe or create more accounts."],
              ["Your key was lost, expired or replaced (401)", "Create a replacement in My access, update every client using the old key, then restart the MCP connection. Keys expire after 90 days. Check that the subscription is active and the server URL ends in /mcp/marketplace/light. A bearer-token field takes the key alone; a custom Authorization header takes Bearer followed by the key."],
              ["The client opens an OAuth login or shows no tools", "Check that the client supports bearer tokens or custom headers and uses the Marketplace endpoint. Restart the server connection and inspect its tool list. Check client or organization restrictions if tools are disabled. An assistant saying it is connected is not proof: confirm the four tools in the client's MCP settings."],
              ["Rate limit (429) or service unavailable (503)", "Wait for the returned Retry-After interval when present. Light shares its public allowance; a subscription does not reserve a separate quota. Retry later for a temporary dependency failure. Avoid repeated scan requests while an existing scan is running."],
              ["The scan is incomplete or the answer has no evidence", "Keep the returned scan ID and ask the assistant to retrieve status and the result bundle. Read the reported limitations. Stop polling when the scan is terminal, including a failed scan. Do not treat partial output as a complete review."],
            ].map(([question, answer]) => <details key={question} className="py-3"><summary className="cursor-pointer font-semibold text-slate-800">{question}</summary><p className="mt-2">{answer}</p></details>)}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">Email <a className={link} href="mailto:support@certscore.ai">support@certscore.ai</a> with the step that failed, client name/version, error text, time and timezone, and scan ID if available. For subscription issues, include your AWS account number and the subscription details shown in My access. Never send API keys, passwords or AWS setup tokens. Remove them from screenshots too.</p>
        </section>
        <section id="data" className={card} aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-2xl font-semibold">Your access and your data</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p><strong className="text-slate-800">Account identity.</strong> Your Marketplace subscription and key are linked to your signed-in CertScore account. The email comes from CertScore sign-in. A shared key identifies that access credential, not which person is using it.</p>
            <p><strong className="text-slate-800">Public scan results.</strong> Light scans public websites and returns public reports. Keep private URLs and sensitive data out of scan requests. Your assistant also handles the prompts and results under its own terms and privacy settings.</p>
            <p><strong className="text-slate-800">Stopping access.</strong> Replace or revoke a key in My access. Cancel the subscription in AWS Marketplace. Revoking a key does not cancel the subscription, and cancellation does not remove independently public reports.</p>
            <p><strong className="text-slate-800">Privacy questions.</strong> Read our <Link className={link} href="/privacy">privacy policy</Link> and <Link className={link} href="/security">security information</Link>. For retention, deletion or other personal-data requests, use the <Link className={link} href="/privacy-request">privacy request page</Link> or contact support.</p>
          </div>
        </section>
      </div>
      <p className="mt-8 text-xs leading-6 text-slate-500">CertScore provides automated observations of public websites, not legal advice, certification or a compliance determination. Review the evidence and coverage limitations before relying on a result.</p>
    </main>
    <SiteFooter wide={false} />
  </div>;
}
