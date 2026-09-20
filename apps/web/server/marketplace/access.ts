import "server-only";
import { describeMarketplaceAgreement } from "./aws";
import { createMarketplaceAccessVerifier } from "./agreement-access";
import { getActiveMarketplaceKey } from "./repository";

export const verifyMarketplaceAccess = createMarketplaceAccessVerifier({
  binding: getActiveMarketplaceKey,
  agreement: describeMarketplaceAgreement,
});
