import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "../../../server/auth";
import { getMarketplaceClaim, listMarketplaceLicenses } from "../../../server/marketplace/repository";
import { marketplaceConfig, MARKETPLACE_CLAIM_COOKIE, MARKETPLACE_LIGHT_ENDPOINT } from "../../../server/marketplace/config";
import { MarketplaceLightAction } from "../../../components/settings/marketplace-light-action";
import { MarketplaceClientGuide, MarketplaceCopy, MarketplaceRefresh, MarketplaceScanPrompt } from "../../../components/settings/marketplace-light-guide";
import { SiteHeader } from "../../../components/layout/site-header";
import { SiteFooter } from "../../../components/layout/site-footer";
import { MARKETPLACE_LIGHT_LISTING } from "../../../lib/marketplace-light";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "MCP Light | Your website privacy scanning hub",
  description: "Connect CertScore to your AI assistant, scan public websites for privacy signals, and explore the evidence. Free AWS Marketplace MCP Light setup and API keys.",
  robots: { index: false, follow: false }
};

const link = "font-medium text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950";
const primary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";
const followUps = [
  { title: "Understand a finding", body: "Turn a summary into something you can review.", prompt: "Explain the most important finding from this CertScore report. Show the retained evidence, explain its limitations, and suggest what a human should verify next." },
  { title: "Review a site after a change", body: "Updated your banner, tags or privacy policy? Check again.", prompt: "Use CertScore to scan this website again. Tell me the scan date and whether the result was reused. If I provide an earlier report, compare only supported observations with comparable coverage. Do not claim a change from reused or incomplete evidence." },
  { title: "Explore another website", body: "Bring the same questions to your next public site.", prompt: "Help me review another public website with CertScore. Ask me for its URL, scan it, and summarize the privacy signals, supporting evidence, coverage limitations and report link." },
];

function expiryLabel(value: string | Date | null) {
  if (!value) return "unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default async function MarketplaceLightPage() {
  const enabled = marketplaceConfig().CERTSCORE_MARKETPLACE_LIGHT_ENABLED === "1";
  const user = enabled ? await getCurrentUser() : null;
  const claimToken = enabled ? (await cookies()).get(MARKETPLACE_CLAIM_COOKIE)?.value : null;
  const claim = claimToken ? await getMarketplaceClaim(claimToken) : null;
  const licenses = user ? (await listMarketplaceLicenses(user.id)).rows : [];
  const hasActiveLicense = licenses.some(license => license.status === "active");
  const hasKey = licenses.some(license => license.status === "active" && license.token_prefix && !license.revoked_at && license.key_expires_at && new Date(license.key_expires_at).getTime() > Date.now());
  const nextStep = !enabled || !hasActiveLicense || claim ? "access" : hasKey ? "connect" : "access";
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3">Skip to setup</a>
    <SiteHeader wide={false} mobilePrimaryAction="sign-in" accountLink={user ? { href: "#access", label: "My access" } : { href: "/login?next=%2Fmarketplace%2Flight", label: "Sign in" }} />
    <main id="main-content">
      <section className="relative overflow-hidden border-b border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border-[55px] border-sky-100/50" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sky-800">AWS Marketplace · MCP Light</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-900">Free access</span>
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl">A clearer view of<br /><span className="text-sky-700">website privacy.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Give your AI assistant the tools to scan public websites, explain privacy signals and show the evidence behind each finding.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a className={primary} href={`#${nextStep}`}>{hasKey && !claim ? "Connect your assistant" : "Set up free access"}<span aria-hidden="true" className="ml-3">→</span></a>
              <Link href="/marketplace/light/guide" className="py-3 text-sm font-semibold text-sky-800">Step-by-step setup guide <span aria-hidden="true">↗</span></Link>
            </div>
            {hasKey && !claim && <p className="mt-3 text-sm text-slate-600">Already connected? <a className={link} href="#scan">Prepare your next scan</a>.</p>}
            <p className="mt-4 text-xs leading-5 text-slate-500">CertScore account + Marketplace API key. Shared usage limits apply.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_45px_-20px_rgba(2,132,199,0.3)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">From a question to evidence</p>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-lg font-medium leading-7 text-slate-800">“What should I know about this website&apos;s privacy?”</p>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {["Cookies, trackers and third parties", "Consent controls and privacy disclosures", "Supporting evidence and coverage limitations", "A public report you can revisit"].map((item, index) => <li key={item} className="flex items-start gap-3"><span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">{index + 1}</span><span className="pt-0.5">{item}</span></li>)}
            </ul>
          </div>
        </div>
      </section>
      <nav aria-label="MCP Light setup steps" className="border-b border-slate-200 bg-white">
        <ol className="mx-auto grid max-w-6xl grid-cols-3 px-4 sm:px-6">
          {[["access", "Get your key", hasKey ? "Key created" : "Activate your access"], ["connect", "Connect", "Set up your assistant"], ["scan", "Scan & explore", "Choose a website"]].map(([id, title, subtitle], index) => <li key={id} className="border-r border-slate-100 last:border-0"><a href={`#${id}`} className="flex h-full items-center gap-3 px-2 py-5 hover:bg-sky-50 sm:px-5"><span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-800 sm:flex">{index + 1}</span><span><span className="block text-sm font-semibold text-slate-900">{title}</span><span className="mt-1 hidden text-xs text-slate-500 sm:block">{subtitle}</span></span></a></li>)}
        </ol>
      </nav>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <section id="access" aria-labelledby="access-heading" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 1 · Your access</p><h2 id="access-heading" className="mt-2 text-2xl font-semibold tracking-tight">{hasActiveLicense ? "Your Marketplace connection" : "One connection. More websites to explore."}</h2></div>
            {user && <p className="max-w-full break-all rounded-full bg-slate-50 px-3 py-2 text-xs text-slate-600">Signed in as {user.email}</p>}
          </div>
          <p className="mb-5 text-sm leading-6 text-slate-600">Sign in here to manage your subscription and keys. Your assistant uses the API key for scan requests; you do not need to sign in for each scan.</p>
          {!enabled ? <p className="leading-7 text-slate-600">Marketplace setup is temporarily unavailable. Contact <a className={link} href="mailto:support@certscore.ai">support@certscore.ai</a>, or explore the separate <Link className={link} href="/mcp/light">public MCP Light option</Link>.</p> : <>
            {!user && <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-5"><h3 className="font-semibold">{claim ? "Your AWS handoff is ready" : "Already subscribed?"}</h3><p className="mb-4 mt-2 text-sm leading-6 text-slate-600">Sign in or create your CertScore account. Then confirm your AWS subscription and create your API key.</p><Link className={primary} href="/login?next=%2Fmarketplace%2Flight">Sign in or create an account</Link></div>
              <div className="rounded-xl border border-slate-200 p-5"><h3 className="font-semibold">New to Marketplace Light?</h3><p className="mb-4 mt-2 text-sm leading-6 text-slate-600">Subscribe to the free offering in AWS Marketplace, then choose <strong>Set up your account</strong> to return here.</p><a className={link} href={MARKETPLACE_LIGHT_LISTING}>Open AWS Marketplace ↗</a></div>
            </div>}
            {claim && user && <div className="mb-5 space-y-4 rounded-xl border border-sky-200 bg-sky-50 p-5"><h3 className="text-lg font-semibold">Confirm your AWS subscription</h3><p className="text-sm leading-6 text-slate-700">Confirm that AWS account <strong>{claim.buyer_account_id}</strong> belongs to you or your organization. This links its subscription to <strong className="break-all">{user.email}</strong>.</p><MarketplaceLightAction operation="claim" label="Confirm and link subscription" /></div>}
            {user && !claim && licenses.length === 0 && <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50 p-5"><h3 className="font-semibold">Finish linking your subscription</h3><p className="text-sm leading-6 text-slate-600">In AWS Marketplace, open this subscribed product and choose <strong>Set up your account</strong>. That secure handoff lets us link your subscription. If an earlier setup link expired, start there again.</p><a className={link} href={MARKETPLACE_LIGHT_LISTING}>Continue in AWS Marketplace ↗</a></div>}
            <div className="space-y-4">{licenses.map(license => {
              const expired = license.key_expires_at && new Date(license.key_expires_at).getTime() <= Date.now();
              const usableKey = Boolean(license.token_prefix && !license.revoked_at && !expired);
              return <article key={license.license_arn} className="rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">AWS account {license.buyer_account_id}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${license.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{license.status === "active" ? "Subscription active" : license.status === "pending" ? "Activation pending" : "Subscription inactive"}</span></div>
                {license.status === "pending" ? <div className="mt-4 space-y-3"><p className="text-sm leading-6 text-slate-600">Your subscription is linked. We are waiting for AWS to confirm activation before issuing a key. Check again shortly. If this continues, contact support with your AWS account and license details below.</p><MarketplaceRefresh /></div> : license.status !== "active" ? <p className="mt-4 text-sm leading-6 text-slate-600">This subscription cannot access Marketplace MCP Light. Manage it in <a className={link} href={MARKETPLACE_LIGHT_LISTING}>AWS Marketplace</a>. After subscribing again, choose <strong>Set up your account</strong> to link the new subscription.</p> : <div className="mt-4 space-y-4">
                  <p className="text-sm leading-6 text-slate-600">{usableKey ? "A key has been created. Add it to your MCP client, then check that the four tools appear in step 2. This page does not verify your client's connection. If you no longer have the key, create a replacement below." : "Create a key, save it securely, then connect your assistant in step 2."}</p>
                  {license.token_prefix && <p className="text-xs leading-5 text-slate-500"><code>{license.token_prefix}…</code> · {license.revoked_at ? "Revoked" : expired ? "Expired — create a replacement" : `Expires ${expiryLabel(license.key_expires_at)} (UTC)`}</p>}
                  <MarketplaceLightAction operation="rotate" licenseArn={license.license_arn} label={usableKey ? "Replace API key" : "Create API key"} canRevoke={Boolean(license.token_prefix && !license.revoked_at)} />
                </div>}
                <details className="mt-4 text-xs text-slate-500"><summary className="cursor-pointer py-2 font-medium">Subscription details for support</summary><p className="mt-2 break-all font-mono">{license.license_arn}</p></details>
              </article>;
            })}</div>
            <p className="mt-5 text-xs leading-5 text-slate-500">Keys expire after 90 days. Replacing or revoking a key stops new requests using it. Manage subscription cancellation in AWS Marketplace; public reports remain public.</p>
          </>}
        </section>
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <section id="connect" aria-labelledby="connect-heading" className="min-w-0 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 2 · Connect once</p><h2 id="connect-heading" className="mb-3 mt-2 text-2xl font-semibold tracking-tight">Bring CertScore into your assistant</h2><p className="mb-6 text-sm leading-6 text-slate-600">MCP connects your assistant to CertScore&apos;s scanning tools. Once connected, you can ask questions in plain language.</p>
            <MarketplaceClientGuide endpoint={MARKETPLACE_LIGHT_ENDPOINT} />
          </section>
          <section id="scan" aria-labelledby="scan-heading" className="min-w-0 scroll-mt-28 rounded-2xl border border-sky-200 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(2,132,199,0.3)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 3 · Scan & explore</p><h2 id="scan-heading" className="mb-3 mt-2 text-2xl font-semibold tracking-tight">Your next website starts here</h2><p className="mb-6 text-sm leading-6 text-slate-600">Choose a website and a question. We&apos;ll prepare a prompt that asks your connected assistant for evidence, context and a report link.</p>
            <MarketplaceScanPrompt />
            <div className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">What happens next?</p><p className="mt-2">Your assistant starts or reuses a scan, checks progress and retrieves the results. Ask follow-up questions about the evidence. A partial preview is not the final report.</p></div>
          </section>
        </div>
        <section aria-labelledby="explore-heading" className="py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Keep the conversation going</p><h2 id="explore-heading" className="mt-2 text-3xl font-semibold tracking-tight">One scan is a starting point.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Save your report link. Come back when you add a vendor, update your website or have another site to review. Bookmark this page for prompts and connection settings.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{followUps.map(item => <article key={item.title} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">{item.title}</h3><p className="mb-4 mt-2 text-sm leading-6 text-slate-600">{item.body}</p><details className="mb-4 text-sm text-slate-600"><summary className="cursor-pointer py-1 font-medium text-sky-800">Read the prompt</summary><p className="mt-3 leading-6">{item.prompt}</p></details><div className="mt-auto"><MarketplaceCopy value={item.prompt} label="Copy follow-up" /></div></article>)}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Light may reuse a recent result and shares a public scan allowance. It does not include scheduled monitoring or private workspace history.</p>
        </section>
        <section aria-labelledby="help-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]"><div><h2 id="help-heading" className="text-2xl font-semibold tracking-tight">A little help, when you need it.</h2><p className="mt-3 text-sm leading-7 text-slate-600">For setup or scanning questions, email <a href="mailto:support@certscore.ai" className={link}>support@certscore.ai</a>. Include the error, time and timezone, client name/version and scan ID if available. Never send your API key or AWS setup token.</p><div className="mt-5 flex flex-wrap gap-5 text-sm"><Link className={link} href="/marketplace/light/guide">Marketplace quick start</Link><Link className={link} href="/marketplace/light/guide#data">Access &amp; data</Link><Link className={link} href="/contact">Contact CertScore</Link></div></div>
            <div className="divide-y divide-slate-100">
              {[
                ["My client says unauthorized (401).", "Check that you used the Marketplace endpoint and supplied Authorization: Bearer followed by your API key. The key must be unexpired and not revoked, and its subscription must be active. After replacing a key, update your client and start a new MCP session."],
                ["I received a rate limit (429) or temporary error (503).", "Honor the returned Retry-After interval. Marketplace Light shares the public Light allowance; subscribing does not add a dedicated allowance. If the service is temporarily unavailable, retry later. Avoid repeatedly starting the same scan."],
                ["Which assistants can connect?", "Use a remote MCP client that supports Streamable HTTP and a custom Authorization header or bearer token. An OAuth-only connector cannot use this API-key endpoint directly. See the setup choices above and your client's documentation."],
                ["Are my scans private?", "No. Light is for public websites and public reports. Do not submit private URLs or sensitive data. Your API key is private and belongs only in your client's authentication settings. Revoking access does not remove independently public reports."],
                ["Does a finding prove a compliance violation?", "No. Results describe automated observations with evidence and coverage limitations. Missing evidence does not establish compliance or absence of risk. Use the findings to guide human review."],
              ].map(([question, answer]) => <details key={question} className="py-3 first:pt-0"><summary className="cursor-pointer py-2 text-sm font-semibold text-slate-800">{question}</summary><p className="pb-2 pt-1 text-sm leading-6 text-slate-600">{answer}</p></details>)}
            </div>
          </div>
        </section>
      </div>
    </main>
    <aside aria-label="Scanning disclaimer" className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6"><p className="mx-auto max-w-6xl text-xs leading-6 text-slate-500">CertScore provides automated observations of public websites, not legal advice, certification or a compliance determination. Review the evidence and coverage limitations before relying on a result.</p></aside>
    <SiteFooter wide={false} />
  </div>;
}
