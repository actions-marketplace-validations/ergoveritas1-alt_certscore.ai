import test from "node:test";
import assert from "node:assert/strict";
import {serviceIntegrationGroup as group, groupedOrigin} from "./service-integration-group";
import { resolveCanonicalVendor } from "@certscore/vendor-resolver";
test("retained Maps support endpoints join Maps while shared font endpoints keep their own identity", () => {
 const cursor=resolveCanonicalVendor({type:"request",url:"https://maps.gstatic.com/mapfiles/openhand_8_8.cur"}).observation;
 assert.ok(cursor);
 assert.equal(group(cursor).name,"Google Maps");
 const fonts=resolveCanonicalVendor({type:"request",url:"https://fonts.gstatic.com/s/opensans/font.woff2"}).observation;
 assert.ok(fonts);
 assert.equal(group(fonts).name,"Google Fonts");
});
test("groups integration variants without merging unrelated products owned by the same company", () => {
 const maps=group({entity:"Google LLC",vendor:"Google",product:"Google Maps embed"});
 assert.equal(maps.key,group({entity:"Google LLC",vendor:"Google",product:"Google Maps JavaScript API"}).key);
 const youtube=group({entity:"Google LLC",vendor:"YouTube",product:"YouTube Image CDN"});
 assert.equal(youtube.key,group({entity:"Google LLC",vendor:"YouTube",product:"YouTube Embedded Player"}).key);
 assert.notEqual(maps.key,youtube.key);
 assert.notEqual(maps.key,group({entity:"Google LLC",vendor:"Google",product:"Google Fonts"}).key);
 assert.equal(group({entity:"Meta Platforms, Inc.",vendor:"Meta",product:"Meta Pixel"}).key,group({entity:"Meta Platforms, Inc.",vendor:"Facebook",product:"Facebook Page Plugin"}).key);
 assert.notEqual(group({entity:"Other",product:"Meta Pixel"}).name,"Facebook");
 assert.deepEqual(groupedOrigin({key:JSON.stringify(["Google LLC","YouTube","YouTube Embedded Player"]),name:"YouTube Embedded Player"}),youtube);
});

test("canonical functional purposes outrank delivery dependencies without erasing other functions", async () => {
 const {serviceIntegrationPurposes: purposes} = await import('./service-integration-group');
 const r = (product: string, vendor = 'Google', entity = 'Google LLC') => ({context:{identity:{product,vendor,entity}}});
 const maps=r('Google Maps JavaScript API'), fonts=r('Google Fonts');
 const facebook=r('Facebook Page Plugin','Facebook','Meta Platforms, Inc.');
 const assets=r('Facebook Static Assets','Meta','Meta Platforms, Inc.');
 const pixel=r('Meta Pixel','Meta','Meta Platforms, Inc.');
 assert.deepEqual(purposes([maps,fonts]),['Maps / location services']);
 assert.deepEqual(purposes([assets,facebook]),['Social media embed']);
 assert.deepEqual(purposes([facebook,assets,pixel]),['Advertising','Social media embed']);
 assert.deepEqual(purposes([fonts]),['Font delivery']);
 assert.deepEqual(purposes([assets]),['CDN']);
 assert.deepEqual(purposes([{context:{identity:null}}]),['Unknown']);
 assert.deepEqual(purposes([r('Unrecognized product')]),['Unknown']);
});

test("resource labels use canonical function without changing storage classification", async () => {
  const { resourcePurposeLabels } = await import("./service-integration-group");
  assert.deepEqual(resourcePurposeLabels({vendor: "Google", product: "Google Maps JavaScript API"}, "request", ["infrastructure"]), ["Maps / location services"]);
  assert.deepEqual(resourcePurposeLabels({vendor: "YouTube", product: "YouTube Embedded Player"}, "embed", ["infrastructure"]), ["Embedded media"]);
  assert.deepEqual(resourcePurposeLabels(null, "request", ["infrastructure"]), ["infrastructure"]);
  assert.deepEqual(resourcePurposeLabels({vendor: "Google", product: "Google Maps JavaScript API"}, "cookie", ["analytics"]), ["analytics"]);
});
