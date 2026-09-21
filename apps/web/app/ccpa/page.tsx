import { SiteHeader } from "../../components/layout/site-header";
import { SiteFooter } from "../../components/layout/site-footer";
import { AiVisibilityContent } from "../../components/marketing/ai-visibility-content";
import { createPageMetadata, createPublicArticleSchema, createBreadcrumbSchema } from "../../lib/seo";
const content = {
  "title": "CCPA website evidence review: tracking, disclosures, and GPC",
  "description": "Review public website tracking, opt-out surfaces, disclosures, and GPC response as evidence for CCPA assessment, with clear automated-scan limits.",
  "intro": "A website scan can help identify tracking vendors, public disclosures, opt-out surfaces, and observable GPC behavior for CCPA review. It cannot establish whether the law applies to a business, determine every downstream data use, or certify compliance.",
  "sections": [
    {
      "title": "Start with applicability and context",
      "paragraphs": [
        "California\u2019s Attorney General describes consumer rights under the CCPA, including opting out of sale or sharing and using a user-enabled GPC signal. A qualified reviewer must assess applicability and obligations in the business\u2019s actual context.",
        "Keep the site, visitor region, scan time, and public-page coverage attached to the evidence. A result from one page or region cannot stand in for all visitor journeys."
      ],
      "sourceLinks": [
        {
          "href": "https://www.oag.ca.gov/privacy/ccpa",
          "label": "California Attorney General: CCPA"
        }
      ]
    },
    {
      "title": "Review observable tracking and disclosures",
      "paragraphs": [
        "Identify the retained vendor requests, cookies or storage, and relevant policy excerpts. Ask the implementation and privacy owners to reconcile observed activity with intended purposes, vendor arrangements, and public descriptions.",
        "A vendor\u2019s presence does not independently prove a sale or sharing of personal information. Missing or inaccessible policy evidence is a coverage limitation, not automatic proof of a disclosure failure."
      ]
    },
    {
      "title": "Test GPC separately from banner choices",
      "paragraphs": [
        "Compare equivalent fresh passive sessions with and without GPC. Verify actual signal delivery before interpreting response. Keep a visible Reject control, a completed click, a confirmed refusal, and an observable GPC response as distinct facts.",
        "No observable response describes the evidence within a bounded test. Indeterminate delivery or incomplete comparison must stay unknown. Neither result alone establishes a legal conclusion."
      ],
      "sourceLinks": [
        {
          "href": "https://certscore.ai/guides/test-global-privacy-control",
          "label": "GPC testing walkthrough"
        }
      ]
    },
    {
      "title": "Build an evidence packet for review",
      "paragraphs": [
        "Include the target and region, retained requests or storage identities with sensitive values removed, policy references, control observations, GPC proof, contract version, and coverage limitations. Assign follow-up questions to the responsible owner.",
        "Review authenticated experiences, server-side handling, consumer request workflows, contracts, and other regions separately. They are beyond what an unauthenticated public-page scan can establish."
      ]
    }
  ]
};
const path = "/ccpa";
export const metadata = createPageMetadata({ ...content, path });
export default function EvidencePage() {
 return <main className="min-h-screen bg-slate-50"><SiteHeader />
   <AiVisibilityContent {...content} path={path} badge="Evidence standards" showEvidenceExamples={false}
     schema={[createPublicArticleSchema({ ...content, path }), createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: content.title, path }])]}
     relatedLinks={[{ href: "/methodology", label: "Methodology" }, { href: "/guides", label: "Practical guides" }, { href: "/guides/consent-report-example", label: "Annotated report" }]} />
   <SiteFooter /></main>;
}
