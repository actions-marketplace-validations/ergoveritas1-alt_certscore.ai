import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const request = JSON.parse(readFileSync("infra/aws/marketplace-browser/create-draft.json", "utf8"));
const changes = request.ChangeSet as Array<{ ChangeType: string; ChangeName?: string; Entity: { Type: string; Identifier?: string }; DetailsDocument: any }>;

test("browser registration only creates isolated draft entities", () => {
  assert.equal(request.Catalog, "AWSMarketplace");
  assert.ok(request.ClientRequestToken, "Retries must use the same idempotency token");
  const creates = changes.filter(c => c.ChangeType.startsWith("Create"));
  assert.deepEqual(creates.map(c => c.ChangeType).sort(), ["CreateOffer", "CreateProduct"]);
  const references = new Set(creates.map(c => `$${c.ChangeName}.Entity.Identifier`));
  for (const change of changes) {
    assert.ok(!["ReleaseProduct", "ReleaseOffer", "UpdateVisibility", "UpdateDeliveryOptionsVisibility"].includes(change.ChangeType));
    if (change.Entity.Identifier) assert.ok(references.has(change.Entity.Identifier), "Must not mutate an existing product or offer");
  }
  assert.equal(changes.find(c => c.ChangeType === "CreateOffer")!.DetailsDocument.ProductId, "$CreateBrowserProduct.Entity.Identifier");
  assert.deepEqual(changes.find(c => c.ChangeType === "UpdateTargeting")!.DetailsDocument.PositiveTargeting.BuyerAccounts, ["199536052647"]);
});

test("free pricing cannot introduce charges or an unbounded allowance", () => {
  const pricing = changes.find(c => c.ChangeType === "UpdatePricingTerms")!.DetailsDocument;
  assert.equal(pricing.PricingModel, "Free");
  assert.equal(pricing.Terms.length, 1);
  assert.equal(pricing.Terms[0].Type, "UsageBasedPricingTerm");
  assert.deepEqual(pricing.Terms[0].RateCards, [{ RateCard: [{ DimensionKey: "browser_scans", Price: "0.00" }] }]);
  const dimensions = changes.find(c => c.ChangeType === "AddDimensions")!.DetailsDocument;
  assert.equal(dimensions.length, 1);
  assert.equal(dimensions[0].Key, "browser_scans");
  assert.deepEqual(dimensions[0].Types, ["ExternallyMetered"]);
  const metadata = changes.find(c => c.ChangeType === "UpdateInformation" && c.Entity.Type === "SaaSProduct@1.0")!.DetailsDocument;
  assert.match(metadata.ShortDescription, /50 single-page scans per month/);
  assert.match(metadata.LongDescription, /calendar month \(UTC\)/);
  assert.match(metadata.LongDescription, /Re-subscribing does not reset/);
  assert.ok(metadata.ProductTitle.length <= 72);
  assert.ok(metadata.SearchKeywords.join("").length <= 250);
  assert.ok(!changes.some(c => c.ChangeType === "AddDeliveryOptions"), "Do not submit unfinished fulfillment");
});
