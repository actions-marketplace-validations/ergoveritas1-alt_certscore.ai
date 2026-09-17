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
test("one identified root combines site-loaded and unresolved resources while embedded resources remain nested", () => {
 const fonts={...service("fonts",[resource("site-font"),resource("embedded-font"),resource("unresolved")],[{...link("site:document","site-font"),kind:"site" as const},link("youtube","embedded-font")]),name:"Google Fonts"};
 const tree=buildServiceHierarchy([service("youtube"),fonts]);
 const roots=tree.filter(x=>x.service.key==="fonts");
 assert.equal(roots.length,1);
 assert.deepEqual(roots[0]!.ownResources.map(x=>x.key).sort(),["site-font","unresolved"]);
 assert.equal(roots[0]!.directSite,false);
 assert.equal(roots[0]!.residual,true);
 assert.deepEqual(roots[0]!.service.origins,fonts.origins);
 assert.deepEqual(tree.find(x=>x.service.key==="youtube")!.children[0]!.ownResources.map(x=>x.key),["embedded-font"]);
 const owned=(branches: ReturnType<typeof buildServiceHierarchy>): string[] => branches.flatMap(branch=>[...branch.ownResources.map(row=>row.key),...owned(branch.children)]);
 assert.deepEqual(owned(tree).sort(),["embedded-font","site-font","unresolved","youtube"]);
});
test("merging identified roots retains linked children exactly once without merging names across identities", () => {
 const fonts=service("fonts",[resource("direct"),resource("unknown")],[link("site:document","direct")]);
 const sameName={...service("other-fonts"),name:fonts.name};
 const tree=buildServiceHierarchy([fonts,service("assets",[resource("asset")],[link("fonts","asset")]),sameName]);
 const root=tree.find(branch=>branch.service.key==="fonts")!;
 assert.equal(tree.length,2);
 assert.deepEqual(root.children.map(branch=>branch.service.key),["assets"]);
 assert.deepEqual(root.service.resources.map(row=>row.key).sort(),["asset","direct","unknown"]);
});

test("child function and delivery purposes never replace the parent's canonical purpose", () => {
 const identity=(product:string,vendor='Google',entity='Google LLC')=>({identity:{product,vendor,entity}}) as Service['context'];
 const mapsResource={...resource('map'),context:identity('Google Maps JavaScript API')};
 const fontResource={...resource('font'),context:identity('Google Fonts')};
 const maps={...service('maps',[mapsResource]),context:mapsResource.context};
 const fonts={...service('fonts',[fontResource],[link('maps','font')]),context:fontResource.context};
 const tree=buildServiceHierarchy([maps,fonts]);
 assert.deepEqual(tree[0]!.service.purposes,['Maps / location services']);
 assert.deepEqual(tree[0]!.children[0]!.service.purposes,['Font delivery']);
 const inverse=buildServiceHierarchy([{...maps,origins:[link('fonts','map')]},{...fonts,origins:[]}]);
 assert.deepEqual(inverse[0]!.service.purposes,['Font delivery']);
 assert.deepEqual(inverse[0]!.children[0]!.service.purposes,['Maps / location services']);
});
