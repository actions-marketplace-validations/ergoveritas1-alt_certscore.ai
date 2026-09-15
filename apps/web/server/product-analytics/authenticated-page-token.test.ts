import assert from "node:assert/strict";
import test from "node:test";
import { issueAuthenticatedPageToken, verifyAuthenticatedPageToken } from "./authenticated-page-token";
const secret = "a-test-secret-that-is-at-least-32-characters";
const identity = {id: "0acbb07b-cd0c-4aca-b2bf-32f0da702c28", userId: "ceadffd9-640c-41ad-a183-65795eed5903", requestedAt: 1789039326464, path: "/app/scans/bbbfc77a-a9b2-48a2-8afe-e5f0b1f2eb1c"};
test("authenticated proof binds exact resource, account, request and time", () => {
  const token = issueAuthenticatedPageToken(identity, secret);
  assert.deepEqual(verifyAuthenticatedPageToken(token, identity.path, identity.userId, secret, identity.requestedAt), identity);
  for (const [path, user, key, now] of [
    ["/app", identity.userId, secret, identity.requestedAt],
    [identity.path.replace("bbbfc77a", "abbfc77a"), identity.userId, secret, identity.requestedAt],
    [identity.path, "other-user", secret, identity.requestedAt],
    [identity.path, identity.userId, secret + "different", identity.requestedAt],
    [identity.path, identity.userId, secret, identity.requestedAt + 86400001],
    [identity.path, identity.userId, secret, identity.requestedAt - 5001],
  ] as const) assert.equal(verifyAuthenticatedPageToken(token, path, user, key, now), null);
  assert.equal(verifyAuthenticatedPageToken(token.replace("a1.", "v1."), identity.path, identity.userId, secret, identity.requestedAt), null);
  assert.throws(() => issueAuthenticatedPageToken({...identity, path: "/app?token=secret"}, secret));
  assert.throws(() => issueAuthenticatedPageToken({...identity, path: "/app/arbitrary-user-text"}, secret));
});
