import { permanentRedirect } from "next/navigation";

export default function ConsolidatedGuidePage() {
  permanentRedirect("/guides/check-third-party-cookies-before-consent");
}
