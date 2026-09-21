import { createPublicArticleSchema } from "../../lib/seo";
import { EditorialByline } from "./editorial-byline";
import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@website-signal-risk-scanner/ui";
import { PendingButtonLink } from "../ui/pending-link";

type InsightTemplateProps = {
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  commonPatterns: string[];
  scannerSignals: string[];
  examples: string[];
  relatedLinks: Array<{ href: string; label: string }>;
};

export function InsightTemplate({
  path,
  eyebrow,
  title,
  intro,
  commonPatterns,
  scannerSignals,
  examples,
  relatedLinks
}: InsightTemplateProps) {
  const articleSchema = createPublicArticleSchema({ title, description: intro, path });

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="max-w-3xl space-y-4">
        <Badge tone="neutral">{eyebrow}</Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <EditorialByline path={path} />
        <p className="text-lg text-slate-600">{intro}</p>
      </div>

      <div className="mt-10 grid gap-6">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Typical issues teams run into</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
            {commonPatterns.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>How scanners surface reviewable signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
            {scannerSignals.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Examples of issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
            {examples.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-sand">
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>
              These pages provide compact reference material around the kinds of public website
              signals CertScore.ai can surface for human and agentic review.
            </p>
            <div className="flex flex-wrap gap-3">
              <PendingButtonLink
                className="border-0 bg-[linear-gradient(135deg,#0f8bd7_0%,#1ea7e1_62%,#67c7f0_100%)] text-white shadow-[0_14px_32px_rgba(15,139,215,0.18)] hover:brightness-[1.04]"
                data-analytics-cta-type="scan"
                data-analytics-event="guide_cta_clicked"
                href="/"
                idleContent="Scan a website"
                pendingContent="Opening..."
              />
              {relatedLinks.map((link) => (
                <PendingButtonLink key={link.href} href={link.href} idleContent={link.label} pendingContent="Opening..." variant="secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
