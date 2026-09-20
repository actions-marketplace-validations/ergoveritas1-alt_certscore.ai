"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { bootstrapAppUserSession } from "../bootstrap-user";
import { requireAuthenticatedUser } from "../auth";
import { BROWSER_PATH, BROWSER_CLAIM_COOKIE, BROWSER_WORKSPACE_COOKIE, requireBrowserEnabled } from "./config";
import { claimBrowserLicense, getBrowserClaim, ownedBrowserWorkspace } from "./repository";
import { verifyBrowserWorkspaceAccess, refreshBrowserBuyerLicenses } from "./aws";
import { admitMarketplaceRequest } from "../marketplace/http";
import { browserWorkspaceMatches } from "./workspace-binding";
import { sendBrowserWelcome } from "./welcome";

export type BrowserActionState = { message: string; scanId?: string; success?: boolean };
export async function browserAction(_state: BrowserActionState, form: FormData): Promise<BrowserActionState> {
  const context=await bootstrapAppUserSession(await requireAuthenticatedUser());
  const user=context.user;
  if(!admitMarketplaceRequest(`browser-action:${user.id}`,20)) return {message:"Please wait a minute before trying again."};
  const jar=await cookies();
  const operation=form.get("operation");
  try {
    if(operation==="leave") {
      jar.delete(BROWSER_WORKSPACE_COOKIE);
      revalidatePath(BROWSER_PATH);
      return {message:"Your ordinary CertScore workspace is selected.",success:true};
    }
    requireBrowserEnabled();
    if(operation==="claim") {
      const token=jar.get(BROWSER_CLAIM_COOKIE)?.value??"";
      const claim=await getBrowserClaim(token);
      if(claim && !claim.organization_id) await refreshBrowserBuyerLicenses(claim.buyer_account_id,user.id);
      const org=await claimBrowserLicense(token,user.id);
      jar.delete(BROWSER_CLAIM_COOKIE);
      jar.set(BROWSER_WORKSPACE_COOKIE,org,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
      let emailPending = false;
      try { await sendBrowserWelcome(org,user); } catch { emailPending = true; }
      revalidatePath(BROWSER_PATH);
      return {message:(emailPending ? "Setup email could not be delivered; use Send setup email to retry. " : "Setup instructions sent to your email. ") + "Subscription linked to your separate Marketplace workspace. Check subscription to verify activation.",success:true};
    }
    const org=String(form.get("organizationId")??"");
    if(!/^[0-9a-f-]{36}$/i.test(org) || !await ownedBrowserWorkspace(org,user.id)) throw new Error("Choose a workspace owned by this account.");
    if(operation==="select") {
      jar.set(BROWSER_WORKSPACE_COOKIE,org,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
    } else if(operation==="refresh") {
      await verifyBrowserWorkspaceAccess(org,user.id);
    } else if(operation==="welcome") {
      await sendBrowserWelcome(org,user);
    } else return {message:"Choose a valid action."};
    revalidatePath(BROWSER_PATH);
    return {message:operation==="select"?"Marketplace workspace selected.":operation==="welcome"?"Setup instructions sent to your account email.":"Subscription checked.",success:true};
  } catch(error) { return {message:error instanceof Error?error.message:"Setup is temporarily unavailable. Contact support@certscore.ai."}; }
}
export async function browserScanAction(_state: BrowserActionState,form: FormData): Promise<BrowserActionState> {
  requireBrowserEnabled();
  const { getDashboardContext }=await import("../auth");
  const context=await getDashboardContext();
  if(!browserWorkspaceMatches(context,form.get("organizationId"))) return {message:"Your workspace selection changed. Refresh this page and select the intended Marketplace workspace before scanning."};
  if(!admitMarketplaceRequest(`browser-scan:${context.user.id}`,10)) return {message:"Please wait a minute before starting another scan."};
  const requestId=String(form.get("requestId")??"");
  if(!/^[0-9a-f-]{36}$/i.test(requestId)) return {message:"Refresh the page and try again."};
  try {
    const { createOrQueueDomainScan }=await import("../domains/create-domain");
    const { getScanRequesterIpContext }=await import("../scans/requester-ip-context");
    const result=await createOrQueueDomainScan({browserWorkspaceId:context.organization.id,domain:String(form.get("domain")??""),allowExistingDomainRescan:true,
      clientRequestId:requestId,localV2DagRunViaLambda:true,requesterIpContext:getScanRequesterIpContext(await headers())});
    if(result.error || !result.scanId) return {message:result.error??"The scan could not be started."};
    revalidatePath(BROWSER_PATH);
    return {message:result.reusedExistingScan?"A recent report is ready. No credit was used.":"Your scan is underway. Open its progress and report below.",scanId:result.scanId,success:true};
  } catch { return {message:"The scan could not be started. Check subscription status or contact support. No result has been inferred."}; }
}
