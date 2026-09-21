import { AiVisibilityContent } from "../../../components/marketing/ai-visibility-content";
import { createPageMetadata } from "../../../lib/seo";
import { buildArticleSchema } from "../ai-guide-content";

const guide = {
  "badge": "Forms & fields guide",
  "title": "Website form scanning: review fields, screenshots and privacy context",
  "description": "Find retained forms and fields, open verified form screenshots, and review data collection with privacy notices and supporting website evidence.",
  "path": "/guides/website-form-scanning",
  "intro": "Start with what your public website asks visitors to provide. CertScore.ai puts observed forms, field metadata and available form screenshots in the report, so developers, agencies and privacy reviewers can investigate data collection with the same evidence.",
  "sections": [
    {
      "title": "Find forms in your report",
      "paragraphs": [
        "Run a public website scan, open its completed report and find Forms & fields below Services & Resources. Expand a row to see retained labels, field types, required states, checkbox or toggle states, field-review categories and evidence references. The captured page URL and observation reference identify the source.",
        "Single-page scans cover the rendered starting page. Full-site reports also include retained forms from successfully inventoried additional pages within that crawl’s limits. Availability follows your existing scan access; this feature does not expand which pages or scan modes your account can request."
      ]
    },
    {
      "title": "Open a form screenshot",
      "paragraphs": [
        "Choose View form when a verified snapshot is available. The image is a low-resolution crop of the observed form container or the shared container of retained standalone controls, rather than a whole-page screenshot. Input values are masked before image safety review.",
        "Snapshot unavailable or Snapshot withheld means there is no approved image to show. Capture deadlines, changing pages or controls, image bounds and safety-review failures can prevent an image. Retained field evidence can still be useful. An absent screenshot does not create a privacy finding."
      ]
    },
    {
      "title": "Separate review cues from findings",
      "paragraphs": [
        "Field-review indicators help prioritize questions about contact details, credentials, financial information, free text and other potentially sensitive data. A selected marketing control may carry a review cue. These inventory labels do not establish consent validity, a legal data classification or a score deduction.",
        "Review the report’s separately supported findings and Detailed evidence. For example, retained sensitive-surface evidence alongside qualifying tracking or session-replay observations can support a review signal. Co-occurrence does not prove that a provider received field values. Compare the actual fields with the website’s privacy notices and ask the form owner to explain purpose, necessity and handling.",
        "A declared destination identifies the form’s configured action, not a tested submission or proof of data transfer. Passive destination tracing can retain independently verified matches if native events occur during observation; ordinary unattended forms are not exercised. CertScore.ai does not fill or submit these forms."
      ]
    },
    {
      "title": "Understand coverage",
      "paragraphs": [
        "The bounded main-document inventory retains up to 10 forms, 20 fields per form and 60 fields per page, with up to 250 candidate controls inspected. Truncation and missing inventories remain explicit. Hidden controls, iframe contents, login-protected pages and fields revealed only by interaction are outside this coverage.",
        "No forms observed applies only to the inventoried pages and observation window. Missing historical evidence is unknown, not a new zero-form measurement. Old reports are not rescanned to add screenshots. A scan is a point-in-time observation, not a complete map of every collection flow or a GDPR compliance determination."
      ]
    },
    {
      "title": "Use evidence outside the report",
      "paragraphs": [
        "The Forms & fields copy button copies retained rows and field metadata as JSON. Report-evidence JSON through API v2 preserves displayed form records, coverage and snapshot links; full-site evidence includes retained additional-page forms when that report is complete. Image bytes are separate downloads, not embedded in the JSON.",
        "MCP clients can use certscore_get_report_evidence_page for authorized report evidence, follow pagination or use its returned download link, and resolve reportContentRef pointers. Use the snapshot links returned for that report and preserve their access requirements. A short scan summary is not the full forms inventory. The report PDF includes a textual data-collection appendix with retained form and field metadata and coverage; use the interactive report or JSON for snapshot links."
      ]
    }
  ]
};
export const metadata = createPageMetadata({title: guide.title, description: guide.description, path: guide.path});
export default function FormsGuidePage() {
 return <AiVisibilityContent {...guide} schema={buildArticleSchema(guide)} showEvidenceExamples={false} relatedLinks={[
 {href:"/releases/forms-capture",label:"Read the forms capture release"},
 {href:"/developers/mcp#forms-evidence",label:"Retrieve forms through MCP and API"},
 {href:"/how-it-works#forms",label:"How forms capture works"}
 ]}/>;
}
