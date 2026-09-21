import assert from "node:assert/strict";
import test from "node:test";
import type { DescribeAgreementOutput } from "@aws-sdk/client-marketplace-agreement";
import { browserAgreementAllowsAccess } from "./agreement";
const expected={agreementId:"agmt-new",buyer:"123456789012",seller:"199536052647",productId:"prod-35ca6yuplccjo",offerId:"offer-igm3spsgqmmea"};
const now=Date.parse("2026-09-20T12:00:00Z");
const good:DescribeAgreementOutput={agreementId:expected.agreementId,status:"ACTIVE",startTime:new Date(now-1000),acceptor:{accountId:expected.buyer},proposer:{accountId:expected.seller},proposalSummary:{offerId:expected.offerId,resources:[{id:expected.productId,type:"SaaSProduct"}]}};
test("free browser agreement validates all parties, resource, offer and time",()=>{
 assert.equal(browserAgreementAllowsAccess(good,expected,now),true);
 const invalid: Partial<DescribeAgreementOutput>[] = [{agreementId:"agmt-other"},{acceptor:{accountId:"000000000000"}},{proposer:{accountId:"000000000000"}},{status:"CANCELLED"},{status:"EXPIRED"},{startTime:new Date(now+1)},{startTime:undefined},{endTime:new Date(now)},{proposalSummary:{...good.proposalSummary,offerId:"offer-mcp"}},{proposalSummary:{...good.proposalSummary,resources:[{id:"prod-eagvxckgntmxc",type:"SaaSProduct"}]}},{proposalSummary:{...good.proposalSummary,resources:[]}}];
 for(const bad of invalid) assert.equal(browserAgreementAllowsAccess({...good,...bad},expected,now),false,JSON.stringify(bad));
});
