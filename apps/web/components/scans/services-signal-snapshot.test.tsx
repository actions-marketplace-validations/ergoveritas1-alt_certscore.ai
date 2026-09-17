import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ServicesSignalSnapshot, ServicesSnapshotContext } from "./services-signal-snapshot";

const overview = { identifiedServices: 2, identifiedServiceNames: ["Google Maps", "BST DSGVO Cookie notice plugin, non-TCF"], distinctResources: 3, distinctStorage: 0, distinctEmbeds: 1, unattributedResources: 0 };
test("site snapshot uses the unfiltered site inventory rather than starting-page identities", () => {
 const html = renderToStaticMarkup(<ServicesSnapshotContext.Provider value={{overview,navigate:()=>{}}}><ServicesSignalSnapshot overview={{...overview, identifiedServices:1, identifiedServiceNames:["Wrong scope"]}} /></ServicesSnapshotContext.Provider>);
 assert.match(html,/Scanned pages/);
 assert.match(html,/Google Maps/);
 assert.match(html,/BST DSGVO/);
 assert.match(html,/vendor-logos\/google.png/);
 assert.match(html,/View services/);
 assert.doesNotMatch(html,/Wrong scope/);
 assert.equal((html.match(/<li /g) ?? []).length,2);
});
test("pending site inventory does not borrow a starting-page count", () => {
 const html=renderToStaticMarkup(<ServicesSnapshotContext.Provider value={{navigate:()=>{}}}><ServicesSignalSnapshot overview={overview} /></ServicesSnapshotContext.Provider>);
 assert.match(html,/Unavailable/);
 assert.doesNotMatch(html,/Google Maps|BST DSGVO/);
});
