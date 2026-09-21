"use client";
import { useActionState } from "react";
import Link from "next/link";
import { browserAction, browserScanAction } from "../../server/marketplace-browser/actions";
const button="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-800 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-900 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700";
export function BrowserAction({operation,organizationId,label}:{operation:string;organizationId?:string;label:string}) {
  const [state,action,pending]=useActionState(browserAction,{message:""});
  return <form action={action} className="space-y-2"><input type="hidden" name="operation" value={operation}/>{organizationId&&<input type="hidden" name="organizationId" value={organizationId}/>}
    <button className={button} disabled={pending}>{pending?"Working…":label}</button>{state.message&&<p role="status" className="max-w-xl text-sm leading-6 text-slate-600">{state.message}</p>}</form>;
}
export function BrowserScanForm({requestId,organizationId,disabled}:{requestId:string;organizationId?:string;disabled:boolean}) {
  const [state,action,pending]=useActionState(browserScanAction,{message:"",scanId:undefined as string|undefined});
  return <form action={action} className="space-y-4"><input type="hidden" name="requestId" value={requestId}/><input type="hidden" name="organizationId" value={organizationId??""}/>
    <label className="block text-sm font-semibold" htmlFor="browser-url">Public website URL</label>
    <input id="browser-url" name="domain" type="url" required placeholder="https://example.com" maxLength={2048} disabled={disabled||pending}
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-sky-700 disabled:bg-slate-50"/>
    <p className="text-xs leading-5 text-slate-500">One URL per scan. Use public URLs only, without credentials or sensitive data. Coverage varies by website.</p>
    <button className={button} disabled={disabled||pending}>{pending?"Starting your scan…":"Run a website scan"}</button>
    {state.message&&<p role="status" className="text-sm leading-6 text-slate-600">{state.message}</p>}
    {state.scanId&&<Link className="block font-semibold text-sky-800 underline underline-offset-4" href={`/app/scans/${state.scanId}`}>View scan progress and report →</Link>}
  </form>;
}
