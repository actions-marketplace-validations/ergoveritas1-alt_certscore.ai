import "server-only";

export const BROWSER_PRODUCT_ID = "prod-35ca6yuplccjo";
export const BROWSER_PRODUCT_CODE = "1rlcf9he502qz0ix13gqfiaoc";
export const BROWSER_OFFER_ID = "offer-igm3spsgqmmea";
export const BROWSER_SELLER = "199536052647";
export const BROWSER_TOPIC = "arn:aws:sns:us-east-1:199536052647:certscore-marketplace-browser-events";
export const BROWSER_PATH = "/marketplace/browser";
export const BROWSER_CLAIM_COOKIE = "certscore_marketplace_browser_claim";
export { BROWSER_WORKSPACE_COOKIE } from "../../lib/marketplace-browser-navigation";
export const BROWSER_MONTHLY_LIMIT = 50;
export function browserEnabled() { return process.env.CERTSCORE_MARKETPLACE_BROWSER_ENABLED === "1"; }
export function requireBrowserEnabled() {
  if (!browserEnabled()) throw new Error("Browser Marketplace setup is temporarily unavailable.");
}
