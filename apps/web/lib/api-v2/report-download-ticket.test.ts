import assert from "node:assert/strict";
import test from "node:test";
import { issueReportDownloadTicket, verifyReportDownloadTicket } from "./report-download-ticket";
const scan = "b90be508-519a-4f03-a9be-bdfd6c0bf27f";
const org = "00000000-0000-4000-8000-000000000001";
const now = 1789250000000;
const secret = "test-report-signing-secret";
test("report capability is bound to one scan and expires in five minutes", () => {
  const issued = issueReportDownloadTicket(scan, org, secret, now);
  assert.deepEqual(verifyReportDownloadTicket(issued.ticket, scan, secret, now), { organizationId: org });
  assert.equal(Date.parse(issued.expiresAt), now + 300000);
  assert.equal(verifyReportDownloadTicket(issued.ticket, scan, secret, now + 300000), null);
  assert.equal(verifyReportDownloadTicket(issued.ticket, org, secret, now), null);
  assert.equal(verifyReportDownloadTicket(issued.ticket, scan, "wrong-key", now), null);
});
test("forged scope, malformed payloads, and excessive lifetimes fail closed", () => {
  const { ticket } = issueReportDownloadTicket(scan, org, secret, now);
  const [payload, signature] = ticket.split(".");
  const claims = JSON.parse(Buffer.from(payload!, "base64url").toString());
  claims.organizationId = scan;
  const forged = `${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${signature}`;
  for (const value of [forged, "", ".", "bad.bad", ticket + "x", "x".repeat(1025)]) assert.equal(verifyReportDownloadTicket(value, scan, secret, now), null);
  assert.equal(verifyReportDownloadTicket(ticket, scan, secret, now - 1000), null);
  assert.throws(() => issueReportDownloadTicket(scan, org, "", now));
});
