import assert from "node:assert/strict";
import test from "node:test";
import { actionStorageCollectionDiagnostics, normalizeActionStorageSnapshot } from "./action-storage-snapshot.js";

test("preserves empty storage names and values while dropping malformed records", () => {
  const result = normalizeActionStorageSnapshot({
    cookies: [
      { name: "", value: "", domain: "example.test", path: "/", partitionKey: null },
      null,
      { name: "broken", value: null, domain: "example.test", path: "/" },
    ],
    localStorage: [["", ""], ["valid", ""], null, ["bad", null]],
    sessionStorage: [["", "value"], { name: "not-a-tuple" }],
  });

  assert.deepEqual(result.cookies, [{ name: "", value: "", domain: "example.test", path: "/" }]);
  assert.deepEqual(result.localStorage, [["", ""], ["valid", ""]]);
  assert.deepEqual(result.sessionStorage, [["", "value"]]);
  assert.equal(result.droppedCookies, 2);
  assert.equal(result.droppedLocalStorage, 2);
  assert.equal(result.droppedSessionStorage, 1);
});

test("fails closed for null snapshot containers", () => {
  const result = normalizeActionStorageSnapshot({
    cookies: null,
    localStorage: undefined,
    sessionStorage: null,
  });
  assert.deepEqual(result.cookies, []);
  assert.deepEqual(result.localStorage, []);
  assert.deepEqual(result.sessionStorage, []);
  assert.equal(result.droppedCookies, 1);
  assert.equal(result.droppedLocalStorage, 1);
  assert.equal(result.droppedSessionStorage, 1);
});

test("collection diagnostics distinguish empty, sampled, partial, and failed channels", () => {
  const diagnostics = actionStorageCollectionDiagnostics({
    cookies: { count: 0, dropped: 0, available: true, limit: 96 },
    localStorage: { count: 96, dropped: 0, available: true, limit: 96, retainedCount: 80 },
    sessionStorage: { count: 4, dropped: 1, available: true, limit: 96 },
  });
  assert.equal(diagnostics.cookies.status, "empty");
  assert.equal(diagnostics.localStorage.status, "sampled");
  assert.equal(diagnostics.sessionStorage.status, "partial");
  assert.equal(actionStorageCollectionDiagnostics({
    cookies: { count: 0, dropped: 0, available: false, limit: 96 },
    localStorage: { count: 0, dropped: 0, available: true, limit: 96 },
    sessionStorage: { count: 0, dropped: 0, available: true, limit: 96 },
  }).cookies.status, "failed");
});

test("mixed-channel overflow reports actual entries retained by the shared packet cap", () => {
  const diagnostics = actionStorageCollectionDiagnostics({
    cookies: { count: 96, dropped: 0, available: true, limit: 96, retainedCount: 96 },
    localStorage: { count: 30, dropped: 0, available: true, limit: 96, retainedCount: 0 },
    sessionStorage: { count: 0, dropped: 0, available: true, limit: 96, retainedCount: 0 },
  });
  assert.equal(diagnostics.cookies.retainedCount, 96);
  assert.equal(diagnostics.localStorage.retainedCount, 0);
  assert.equal(diagnostics.localStorage.droppedCount, 30);
  assert.equal(diagnostics.localStorage.status, "sampled");
});
