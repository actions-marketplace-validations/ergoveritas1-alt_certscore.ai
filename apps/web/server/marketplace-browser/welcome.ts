import "server-only";
import { withWriteTransaction } from "@website-signal-risk-scanner/db";
import nodemailer from "nodemailer";
import { getGmailConfig } from "../email/gmail";

// Delivery is bounded to an explicit claim or customer retry, never a background campaign.
export async function sendBrowserWelcome(org: string, user: { id: string; email: string }) {
  const config = getGmailConfig();
  if (!config) throw new Error("Email is temporarily unavailable. Your workspace is still available here.");
  await withWriteTransaction(async client => {
    const result = await client.query<{ welcome_sent_at: Date | null }>(
      `select welcome_sent_at from marketplace_browser_workspaces where organization_id=$1 and owner_user_id=$2 for update`, [org,user.id]);
    if (!result.rows[0]) throw new Error("Workspace unavailable.");
    if (result.rows[0].welcome_sent_at) return;
    await nodemailer.createTransport({service:"gmail",auth:{user:config.fromEmail,pass:config.appPassword},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:10000}).sendMail({
      from: `"CertScore.ai" <${config.fromEmail}>`, to: user.email,
      subject: "Your CertScore.ai Marketplace workspace is ready",
      text: "Your CertScore account is linked to an AWS Marketplace browser-scanner workspace.\n\nOpen https://certscore.ai/marketplace/browser to check activation, enter a public website URL, run a scan, and view its report. Free access includes 50 single-page scans per UTC calendar month.\n\nSupport: support@certscore.ai\nAutomated observations are not legal advice, certification, or proof of compliance."
    });
    await client.query(`update marketplace_browser_workspaces set welcome_sent_at=now() where organization_id=$1`, [org]);
  });
}
