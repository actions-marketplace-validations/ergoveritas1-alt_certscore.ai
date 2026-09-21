"use server";
import { queryOne } from "@website-signal-risk-scanner/db";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminContext } from "../../../../server/admin/platform-admin";
export async function refundBrowserScan(_state: {message:string},form:FormData) {
  const {user}=await requirePlatformAdminContext();
  const scan=String(form.get("scanId")??"");
  const reason=String(form.get("reason")??"").trim();
  if(!/^[0-9a-f-]{36}$/i.test(scan)||reason.length<5||reason.length>500) return {message:"Enter a valid scan and a recovery reason (5–500 characters)."};
  try {
    const row=await queryOne<{refunded:boolean}>(`select refund_undispatched_marketplace_browser_scan($1,$2,$3) as refunded`,[scan,user.id,reason]);
    revalidatePath("/app/admin/marketplace-browser");
    revalidatePath("/marketplace/browser");
    return {message:row?.refunded?"Cancelled before dispatch; one credit returned.":"No change. This scan was already refunded or has no Marketplace reservation."};
  } catch {return {message:"Refund refused: dispatch is not proven unattempted, or the ledger needs review."};}
}
