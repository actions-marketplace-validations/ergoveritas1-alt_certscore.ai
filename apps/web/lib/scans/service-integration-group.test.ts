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
