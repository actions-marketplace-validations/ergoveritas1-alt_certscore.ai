import "server-only";
import { query } from "@website-signal-risk-scanner/db";
import type { BrowserLicense } from "./repository";
import { MarketplaceMeteringClient, ResolveCustomerCommand } from "@aws-sdk/client-marketplace-metering";
import { MarketplaceAgreementClient, DescribeAgreementCommand } from "@aws-sdk/client-marketplace-agreement";
import { SNSClient, ConfirmSubscriptionCommand } from "@aws-sdk/client-sns";
import { licenseEventSchema, validateResolvedCustomer } from "../marketplace/contracts";
import { BROWSER_OFFER_ID, BROWSER_PRODUCT_CODE, BROWSER_PRODUCT_ID, BROWSER_SELLER, BROWSER_TOPIC, requireBrowserEnabled } from "./config";
import { applyBrowserEvent, currentBrowserLicense, getBrowserLicense, saveBrowserVerification } from "./repository";
import { browserAgreementAllowsAccess, browserAgreementIdentityMatches } from "./agreement";
const metering=new MarketplaceMeteringClient({region:"us-east-1",maxAttempts:2});
const agreements=new MarketplaceAgreementClient({region:"us-east-1",maxAttempts:2});
const sns=new SNSClient({region:"us-east-1",maxAttempts:2});
const options=()=>({abortSignal:AbortSignal.timeout(10_000)});
export async function resolveBrowserCustomer(token: string) {
  requireBrowserEnabled();
  const response=await metering.send(new ResolveCustomerCommand({RegistrationToken:token}),options());
  return {...validateResolvedCustomer(response,BROWSER_PRODUCT_CODE),CustomerIdentifier:response.CustomerIdentifier};
}
export async function confirmBrowserTopic(token: string) {
  await sns.send(new ConfirmSubscriptionCommand({TopicArn:BROWSER_TOPIC,Token:token,AuthenticateOnUnsubscribe:"true"}),options());
}
async function verifyAgreement(id: string,buyer: string) {
  const agreement=await agreements.send(new DescribeAgreementCommand({agreementId:id}),options());
  const expected={agreementId:id,buyer,seller:BROWSER_SELLER,productId:BROWSER_PRODUCT_ID,offerId:BROWSER_OFFER_ID};
  if(!browserAgreementIdentityMatches(agreement,expected)) throw new Error("Agreement identity could not be verified.");
  const terminal=["CANCELLED","EXPIRED","TERMINATED","REPLACED"].includes(agreement.status??"");
  return {active:browserAgreementAllowsAccess(agreement,expected),expires:terminal?new Date():agreement.endTime??null};
}
// Lifecycle stays operational when new onboarding/scans are disabled.
export async function processBrowserEvent(value: unknown) {
  const event=licenseEventSchema.parse(value);
  const d=event.detail;
  if(event.account!==BROWSER_SELLER || d.product.code!==BROWSER_PRODUCT_CODE || d.product.id!==BROWSER_PRODUCT_ID) throw new Error("Unexpected browser Marketplace event.");
  if(event["detail-type"]==="License Deprovisioned - Manufacturer") { await applyBrowserEvent(event,false,null); return; }
  const result=await verifyAgreement(d.agreement.id,d.acceptor.accountId);
  await applyBrowserEvent(event,result.active,result.expires);
}
export async function verifyBrowserWorkspaceAccess(org: string,user: string) {
  requireBrowserEnabled();
  const license=await currentBrowserLicense(org,user);
  if(!license?.agreement_id) throw new Error("AWS activation is pending. Choose Check subscription or contact support.");
  // Check AWS before each new scan. No stale-while-error or indefinite cached grant.
  const result=await verifyAgreement(license.agreement_id,license.buyer_account_id);
  await saveBrowserVerification(license,result.active,result.expires);
  const current=await getBrowserLicense(license.license_arn);
  if(!result.active || current?.status!=="active" || current.organization_id!==org
    || !current.verified_at || Date.now()-new Date(current.verified_at).getTime()>300_000
    || (current.expires_at && new Date(current.expires_at).getTime()<=Date.now())) throw new Error("This subscription is not active. Manage it in AWS Marketplace or contact support.");
  return current;
}

// Reconcile existing slots before claiming a replacement; delayed events must not reset usage.
export async function refreshBrowserBuyerLicenses(buyer: string,user: string) {
  const licenses=await query<BrowserLicense>(`select l.* from marketplace_browser_licenses l
    join marketplace_browser_workspaces w using(organization_id) where w.buyer_account_id=$1 and w.owner_user_id=$2
    and l.status<>'revoked' and (l.expires_at is null or l.expires_at>now()) limit 10`,[buyer,user]);
  for(const license of licenses.rows) {
    if(!license.agreement_id) throw new Error("An earlier subscription is still awaiting AWS verification. Contact support before linking another.");
    const result=await verifyAgreement(license.agreement_id,buyer);
    await saveBrowserVerification(license,result.active,result.expires);
  }
}
