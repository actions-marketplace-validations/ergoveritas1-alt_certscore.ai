import { createHmac, timingSafeEqual } from "node:crypto";
const TTL_SECONDS = 300;
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(`certscore.report-download.v1:${payload}`).digest();
export function issueReportDownloadTicket(scanId: string, organizationId: string, secret: string, now = Date.now()) {
  if (!secret) throw new Error("Report download signing is unavailable");
  const expires = Math.floor(now / 1000) + TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ scanId, organizationId, expires })).toString("base64url");
  return { ticket: `${payload}.${sign(payload, secret).toString("base64url")}`, expiresAt: new Date(expires * 1000).toISOString() };
}
export function verifyReportDownloadTicket(ticket: string, scanId: string, secret: string, now = Date.now()): { organizationId: string } | null {
  if (!secret || ticket.length > 1024 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket)) return null;
  const [payload, signature] = ticket.split(".") as [string, string];
  const expected = sign(payload, secret);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    if (data.scanId !== scanId || typeof data.organizationId !== "string" || !/^[a-f0-9-]{36}$/i.test(data.organizationId) || !Number.isInteger(data.expires) || data.expires <= seconds || data.expires > seconds + TTL_SECONDS) return null;
    return { organizationId: data.organizationId };
  } catch { return null; }
}
