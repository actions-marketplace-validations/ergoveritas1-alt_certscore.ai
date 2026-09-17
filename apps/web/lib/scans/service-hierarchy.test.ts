import test from "node:test";
import assert from "node:assert/strict";
import { buildServiceHierarchy } from "./service-hierarchy";
type Service = Parameters<typeof buildServiceHierarchy>[0][number];
const resource = (key: string, eventCount = 1, pageIds = ["p"]) => ({key, eventCount, pageIds, purposes: [], inventoryEvidence: "Review"}) as unknown as Service["resources"][number];
const service = (key: string, resources = [resource(key)], origins: Service["origins"] = []) => ({key,name:key,context:{identity:{product:key}},resources,origins,pageIds:["p"]}) as Service;
const link = (key: string, resourceKey: string, occurrenceId = resourceKey) => ({key,name:key,resourceKey,occurrenceId,eventCount:1,pageId:"p",inferred:false,nodeId:"n",edgeIds:["e"]});
test("root integration owns linked services recursively and summarizes distinct branch resources", () => {
 const tree = buildServiceHierarchy([service("youtube"), service("fonts", [resource("f")], [link("youtube","f")]), service("cdn", [resource("c")], [link("fonts","c")])]);
 assert.deepEqual(tree.map(x=>x.service.key),["youtube"]);
 assert.equal(tree[0]!.children[0]!.service.key,"fonts");
 assert.equal(tree[0]!.children[0]!.children[0]!.service.key,"cdn");
 assert.equal(tree[0]!.service.resources.length,3);
 assert.equal(tree[0]!.ownResources.length,1);
});
test("unattributed resources stay separate while fully linked resources move under parent", () => {
 const tree = buildServiceHierarchy([service("youtube"),service("fonts",[resource("linked"),resource("independent")],[link("youtube","linked")])]);
 assert.equal(tree.length,2);
 assert.deepEqual(tree.find(x=>x.service.key==="fonts")!.ownResources.map(x=>x.key),["independent"]);
 assert.deepEqual(tree.find(x=>x.service.key==="youtube")!.children[0]!.ownResources.map(x=>x.key),["linked"]);
});
test("partial, ambiguous, missing-parent and duplicate links cannot hide resource occurrences", () => {
 for (const origins of [[link("youtube","f")],[link("youtube","f"),link("maps","f")],[link("absent","f")],[link("youtube","f"),link("youtube","f")]]) {
  const tree=buildServiceHierarchy([service("youtube"),service("maps"),service("fonts",[resource("f",2)],origins)]);
  assert.ok(tree.some(x=>x.service.key==="fonts"));
  assert.ok(!tree.find(x=>x.service.key==="fonts")?.children.length);
 }
});
test("cycles retain a visible root and each resource exactly once", () => {
 const tree=buildServiceHierarchy([service("a",[resource("a")],[link("b","a")]),service("b",[resource("b")],[link("a","b")])]);
 assert.equal(tree.length,1);
 assert.equal(tree[0]!.service.resources.length,2);
 assert.equal(tree[0]!.children.length,1);
});

test("identified supporting services stay visible while unknown identities stay grouped", () => {
 const fonts = {...service("fonts"),name:"Google Fonts"};
 const bst = {...service("bst", [resource("bst")], [link("absent", "bst")]), name:"BST DSGVO Cookie notice plugin, non-TCF"};
 const unknown = {...service("unknown"), context: {identity:null}} as Service;
 const tree = buildServiceHierarchy([service("youtube"),fonts,bst,unknown]);
 assert.deepEqual(tree.map(x=>x.service.name),["youtube","Google Fonts",bst.name,"Other / unattributed resources"]);
 assert.equal(tree[2]!.residual,true);
 assert.deepEqual(tree[3]!.children.map(x=>x.service.key),["unknown"]);
});
test("verified site-loaded resources are independent; unresolved and embedded resources stay separate", () => {
 const fonts={...service("fonts",[resource("site-font"),resource("embedded-font"),resource("unresolved")],[{...link("site:document","site-font"),kind:"site" as const},link("youtube","embedded-font")]),name:"Google Fonts"};
 const tree=buildServiceHierarchy([service("youtube"),fonts]);
 assert.deepEqual(tree.find(x=>x.directSite)!.ownResources.map(x=>x.key),["site-font"]);
 assert.deepEqual(tree.find(x=>x.service.key==="youtube")!.children[0]!.ownResources.map(x=>x.key),["embedded-font"]);
 assert.deepEqual(tree.find(x=>x.service.key==="fonts" && x.residual)!.ownResources.map(x=>x.key),["unresolved"]);
});
