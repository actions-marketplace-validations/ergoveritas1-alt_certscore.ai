import Link from "next/link";
import type { ReactNode } from "react";
import { BrowserMarketplaceProvider } from "./scope";
export function BrowserShell({children}:{children:ReactNode}) {
  return <BrowserMarketplaceProvider><div className="min-h-screen bg-[#f7fafc] text-slate-900"><a href="#marketplace-main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4">Skip to content</a>
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
      <Link href="/marketplace/browser" className="text-2xl font-semibold tracking-tight">CertScore<span className="text-sky-700">.ai</span></Link>
      <nav aria-label="Marketplace navigation" className="flex gap-5 text-sm font-medium"><a href="/marketplace/browser">My scans &amp; subscription</a><a href="mailto:support@certscore.ai">Support</a></nav>
    </div></header><main id="marketplace-main">{children}</main>
    <footer className="mt-14 border-t border-slate-200 bg-white px-6 py-8 text-xs leading-6 text-slate-500"><div className="mx-auto max-w-6xl">
      <p>Automated observations for human review. Not legal advice, certification, or proof of compliance. Results may be incomplete or incorrect.</p>
      <div className="mt-3 flex flex-wrap gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/methodology">Methodology</Link><a href="mailto:support@certscore.ai">support@certscore.ai</a></div>
      <p className="mt-3">© 2026 CertScore.ai, LLC</p></div></footer></div></BrowserMarketplaceProvider>;
}
