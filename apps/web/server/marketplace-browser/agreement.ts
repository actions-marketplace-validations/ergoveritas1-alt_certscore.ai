import type { DescribeAgreementOutput } from "@aws-sdk/client-marketplace-agreement";
import { agreementAllowsAccess } from "../marketplace/contracts";

export function browserAgreementIdentityMatches(agreement: DescribeAgreementOutput, expected: {
  agreementId: string; buyer: string; seller: string; productId: string; offerId: string;
}) {
  return agreement.agreementId === expected.agreementId
    && agreement.proposer?.accountId === expected.seller
    && agreement.proposalSummary?.offerId === expected.offerId
    && agreement.proposalSummary.resources?.length === 1
    && agreement.proposalSummary.resources[0]?.id === expected.productId
    && agreement.proposalSummary.resources[0]?.type === "SaaSProduct"
    && agreement.acceptor?.accountId === expected.buyer;
}

export function browserAgreementAllowsAccess(agreement: DescribeAgreementOutput, expected: Parameters<typeof browserAgreementIdentityMatches>[1], now=Date.now()) {
  return browserAgreementIdentityMatches(agreement,expected) && agreementAllowsAccess(agreement,expected.buyer,now);
}
