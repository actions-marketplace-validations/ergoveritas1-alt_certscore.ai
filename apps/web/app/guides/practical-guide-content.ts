import type { AiGuideContent } from "./ai-guide-content";

export const practicalGuides = {
  "gpc": {
    "badge": "Practical testing guide",
    "title": "How to test Global Privacy Control (GPC) response",
    "description": "Verify GPC delivery, compare a clean baseline with a GPC-enabled session, and distinguish an observable response from unknown coverage.",
    "path": "/guides/test-global-privacy-control",
    "intro": "Test GPC by comparing equivalent fresh browser sessions with and without the signal. Verify that the signal reached the loaded page, then compare requests, storage, and consent behavior. A configured browser flag or a completed scan alone does not establish that a site honored GPC.",
    "sections": [
      {
        "title": "1. Define a comparable test",
        "paragraphs": [
          "Record the exact HTTPS page, UTC time, browser version, region, and observation window. Use fresh sessions with the same conditions; do not compare a previously accepted visitor with a new visitor. Keep Accept and Reject experiments separate from the passive GPC comparison.",
          "A public-page observation covers the page and window tested. It does not establish account-wide preferences, downstream data use, or behavior in every jurisdiction."
        ]
      },
      {
        "title": "2. Verify delivery before judging response",
        "paragraphs": [
          "In the GPC-enabled session, inspect the actual main-document request for Sec-GPC: 1 and verify navigator.globalPrivacyControl in the loaded document. Retain the request and document identity. Merely configuring injection is weaker than observing delivery.",
          "If the document navigates, a worker fails, or delivery cannot be verified, record the limitation. Do not treat a blocked request as if it contained a transmitted header."
        ],
        "sourceLinks": [
          {
            "href": "https://w3c.github.io/gpc/",
            "label": "Global Privacy Control specification"
          }
        ]
      },
      {
        "title": "3. Compare behavior, not just cookie totals",
        "paragraphs": [
          "Compare exact cookie identities, storage keys, classified vendor requests, advertising or measurement activity, and relevant CMP state. Preserve the baseline and GPC observations so another reviewer can reproduce the comparison.",
          "An unrelated timestamp, random identifier, or CMP storage change is not enough to show a privacy response. Different totals can also reflect incomplete captures, auctions, or page variation."
        ]
      },
      {
        "title": "4. Interpret the three possible outcomes",
        "paragraphs": [
          "GPC response: verified, comparable evidence supports an observable response. This describes behavior; it is not a legal compliance determination.",
          "No observable GPC response: the comparable retained evidence did not show a response within the tested scope. This is not proof of every downstream use of data.",
          "Indeterminate: signal delivery, comparability, or coverage was insufficient. Missing proof must not become a finding that the site ignored the signal."
        ]
      },
      {
        "title": "5. Hand the result to the right owner",
        "paragraphs": [
          "For delivery failures, ask the browser or test owner to resolve the measurement problem. For a comparable no-response result, ask the CMP and tag owners to inspect opt-out mappings, vendor configuration, and regional rules. Preserve the original evidence before making changes.",
          "Use the CCPA review guide for legal context, and the annotated historical report to see why contract version matters when reading older GPC records."
        ]
      }
    ]
  },
  "analytics": {
    "badge": "Troubleshooting guide",
    "title": "Google Analytics or Meta Pixel before consent: how to investigate",
    "description": "Trace Google Analytics and Meta Pixel activity before consent using clean sessions, network evidence, storage changes, and tag-manager configuration.",
    "path": "/guides/google-analytics-meta-pixel-before-consent",
    "intro": "If Google Analytics or Meta Pixel appears before a consent choice, trace the actual request and storage activity before changing settings. A loaded script, a cookieless request, and an identifier-bearing event are different observations. The vendor name alone does not establish what data was sent or whether the activity was permitted.",
    "sections": [
      {
        "title": "1. Capture a fresh pre-consent baseline",
        "paragraphs": [
          "Use a fresh browser profile with no prior choice. Record the page, region, browser settings, time, and observation window. Open the Network and storage panels before loading the page. Preserve the request log across redirects; do not click the banner during this baseline.",
          "Record blocked third-party storage as a coverage condition. A browser that blocks cookies can still show network requests, and an empty cookie list does not establish an absence of tracking."
        ]
      },
      {
        "title": "2. Separate script loading, requests, and storage",
        "paragraphs": [
          "For each relevant event, record its start time, destination host, initiator chain, request category, and any observed cookie or storage write. Redact identifier values and personal data before sharing the evidence.",
          "For Google Analytics, inspect measurement requests as well as the tag loader. For Meta Pixel, inspect the pixel event requests as well as the script. Determine whether a tag manager, hard-coded script, plugin, or embedded service initiated each request; avoid guessing from a cookie name."
        ]
      },
      {
        "title": "3. Understand Google consent mode before interpreting a request",
        "paragraphs": [
          "Google distinguishes basic consent mode, where tags are blocked until consent, from advanced consent mode, which can send cookieless pings with consent denied. A Google request before acceptance is therefore not, by itself, evidence of a consent-mode failure.",
          "Inspect the actual consent state, payload, storage behavior, and intended implementation. Check that defaults are applied before relevant tags execute and that later choice updates reach the tags."
        ],
        "sourceLinks": [
          {
            "href": "https://developers.google.com/tag-platform/security/concepts/consent-mode",
            "label": "Google consent mode overview"
          },
          {
            "href": "https://developers.google.com/tag-platform/security/guides/consent",
            "label": "Google consent implementation guide"
          }
        ]
      },
      {
        "title": "4. Check the implementation path",
        "paragraphs": [
          "Give the tag owner the initiator chain and event timing. Review initialization order, consent categories, tag triggers, duplicate installations, plugin integrations, and tags loaded outside the CMP-controlled path.",
          "Treat Meta and other vendor implementations individually. Google consent-mode behavior does not automatically describe how a different vendor handles consent. Confirm the actual integration settings and retained requests."
        ]
      },
      {
        "title": "5. Retest before consent, after Accept, and after Reject",
        "paragraphs": [
          "Use independent fresh sessions for each path. For action tests, record a completed click separately from confirmed consent registration and completed observation. Preserve requests that began before the choice so they are not mistaken for newly initiated post-choice activity.",
          "A cookie left in storage is not by itself proof of continued use. Look for direct eligible requests or new writes. A failed or partial capture stays inconclusive."
        ]
      },
      {
        "title": "6. Write an actionable issue",
        "paragraphs": [
          "Include the affected page and environment; request destination and initiator; consent state; timing; storage evidence with values redacted; intended behavior; and the responsible tag or CMP owner. After the fix, compare the same conditions and retain the new evidence.",
          "CertScore.ai can supply public-page request, cookie, vendor, and consent observations for this review. Internal tag configuration, server-side processing, legal basis, and all visitor journeys require separate review."
        ]
      }
    ]
  },
  "example": {
    "badge": "Annotated owned-fixture report",
    "title": "How to read a consent report: a retained example",
    "description": "Read a real retained CertScore.ai report from an owned test page, including its scan context, historical Reject result, GPC version, and coverage limits.",
    "path": "/guides/consent-report-example",
    "intro": "This example uses an existing scan of an ErgoVeritas test page, not a customer case study or a new scan. The retained record is useful precisely because it shows both observed behavior and the limits of interpreting older report fields.",
    "sections": [
      {
        "title": "The retained scan context",
        "paragraphs": [
          "Target: https://ergoveritas.com/sample_09_03_26_01.html. Scan ID: f4362840-376e-4d8c-897a-34a220136ad4. The scan started on September 3, 2026 at 18:26:00.362 UTC and completed at 18:26:09.986 UTC. The region recorded in the API is eu_ie.",
          "The public record was checked on September 20, 2026. It reports partial coverage and an automated public-web scan limitation. The fixture is owned and intentionally constructed for testing; it is not a representative sample of production websites."
        ],
        "sourceLinks": [
          {
            "href": "https://certscore.ai/api/v2/scans/f4362840-376e-4d8c-897a-34a220136ad4",
            "label": "Retained public scan record"
          },
          {
            "href": "https://certscore.ai/scan/f4362840-376e-4d8c-897a-34a220136ad4",
            "label": "Open the report"
          }
        ]
      },
      {
        "title": "Read the historical Reject observation carefully",
        "paragraphs": [
          "The legacy postRefusalObservation reports confirmed_observation, refusalExercised: true, four observations, and a verdict describing eligible non-essential activity after confirmed refusal. Its observation completed at 18:26:09.224 UTC. Its strategy stopped on the first eligible activity.",
          "The same API response exposes a newer execution projection marked limited, with clickCompleted, observationCompleted, and consentConfirmed all false. These fields do not support a modern successful-path claim. Preserve the distinction: the historical observation verdict is not interchangeable with a current execution assessment.",
          "This example is an interpretation aid, not proof that the older scan completed today’s full observation protocol. Do not infer an exact request timeline or identify four independent trackers from an observation count."
        ]
      },
      {
        "title": "Read the GPC version before applying newer rules",
        "paragraphs": [
          "The retained GPC result uses certscore.gpc-response-assessment.v1 and says No observable GPC response. It records a comparable passive baseline with Sec-GPC and no observed baseline delta.",
          "That is a historical v1 conclusion. It does not establish compliance, and it must not be silently upgraded to newer delivery or comparison requirements. Current tests should use the GPC testing guide and retain the current contract and proof."
        ]
      },
      {
        "title": "Turn the report into a review task",
        "paragraphs": [
          "Open the finding and its retained evidence. Separate request timing, storage identity, completed action, confirmed registration, and coverage. Assign a concrete configuration question to the CMP or tag owner rather than copying a score as a diagnosis.",
          "After an authorized change, a new comparable scan can test the intended behavior. This walkthrough does not initiate that scan or claim any remediation outcome."
        ]
      }
    ]
  }
} satisfies Record<string, AiGuideContent>;
