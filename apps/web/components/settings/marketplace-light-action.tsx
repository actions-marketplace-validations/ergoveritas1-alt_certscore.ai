"use client";
import { useActionState, useState } from "react";
import { marketplaceAction } from "../../server/marketplace/actions";
import { MarketplaceCopy } from "./marketplace-light-guide";

export function MarketplaceLightAction({ operation, licenseArn, label, canRevoke = false }: { operation: "claim" | "rotate" | "revoke"; licenseArn?: string; label: string; canRevoke?: boolean }) {
  const [state, action, pending] = useActionState(marketplaceAction, { message: "", key: null });
  const [confirm, setConfirm] = useState<"rotate" | "revoke" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const primary = "min-h-11 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50";
  return <form action={action} onSubmit={() => { setConfirm(null); setRevealed(false); }} className="space-y-3">
    {licenseArn && <input type="hidden" name="licenseArn" value={licenseArn} />}
    {confirm ? <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-950">{confirm === "rotate" ? "Replacing this key immediately disconnects clients using the previous key. Update each client with the new key." : "Revoking this key immediately disconnects clients using it. Your AWS subscription stays active."}</p>
      <div className="flex flex-wrap gap-3">
        <button name="operation" value={confirm} disabled={pending} className={primary}>{confirm === "rotate" ? "Replace key now" : "Revoke key now"}</button>
        <button type="button" onClick={() => setConfirm(null)} className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-slate-700">Keep current key</button>
      </div>
    </div> : <div className="flex flex-wrap gap-3">
      {operation === "rotate" && canRevoke ? <button type="button" disabled={pending} className={primary} onClick={() => setConfirm("rotate")}>{pending ? "Working…" : label}</button> : <button name="operation" value={operation} disabled={pending} className={primary}>{pending ? "Working…" : label}</button>}
      {canRevoke && operation !== "revoke" && <button type="button" disabled={pending} onClick={() => setConfirm("revoke")} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Revoke key</button>}
    </div>}
    {!pending && state.message && <p role="status" className="text-sm text-slate-700">{state.message}</p>}
    {!pending && state.key && <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <label className="block text-sm font-semibold text-emerald-950">Save your new API key
        <input type={revealed ? "text" : "password"} readOnly value={state.key} autoComplete="off" spellCheck={false} className="mt-2 block min-h-11 w-full rounded-lg border border-emerald-200 bg-white p-3 font-mono text-sm" onFocus={event => event.target.select()} />
      </label>
      <p className="text-xs leading-5 text-emerald-900">Copy it to your client&apos;s authentication settings. We cannot show it again after you leave this page. Never paste it into a chat or support message.</p>
      <div className="flex flex-wrap items-center gap-3">
        <MarketplaceCopy key={state.key} value={state.key} label="Copy API key" />
        <button type="button" onClick={() => setRevealed(!revealed)} className="min-h-11 px-3 py-2 text-sm font-medium text-emerald-900">{revealed ? "Hide key" : "Show key"}</button>
      </div>
      <a href="#connect" className="inline-block text-sm font-semibold text-sky-800 underline underline-offset-4">Next: connect your assistant →</a>
    </div>}
  </form>;
}
