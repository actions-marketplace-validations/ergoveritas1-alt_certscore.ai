"use client";
import { useActionState } from "react";
import { refundBrowserScan } from "./actions";
export function RefundForm({scanId}:{scanId:string}) {
  const [state,action,pending]=useActionState(refundBrowserScan,{message:""});
  return <form action={action} className="mt-3 flex flex-wrap items-center gap-3"><input type="hidden" name="scanId" value={scanId}/><label>Recovery reason <input className="rounded border p-2" name="reason" minLength={5} maxLength={500} required/></label><button disabled={pending} className="rounded border px-3 py-2">{pending?"Checking…":"Cancel before dispatch and return credit"}</button><p role="status">{state.message}</p></form>;
}
