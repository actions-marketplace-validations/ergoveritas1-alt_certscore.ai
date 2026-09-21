import { confirmBrowserTopic, processBrowserEvent } from "../../../../../server/marketplace-browser/aws";
import { BROWSER_TOPIC } from "../../../../../server/marketplace-browser/config";
import { admitMarketplaceRequest, boundedText } from "../../../../../server/marketplace/http";
import { verifyMarketplaceSns } from "../../../../../server/marketplace/sns";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!admitMarketplaceRequest("browser-events", 120)) return new Response(null, { status: 429 });
  try {
    const message = await verifyMarketplaceSns(JSON.parse(await boundedText(request, 96_000)), BROWSER_TOPIC);
    if (message.Type === "SubscriptionConfirmation") {
      if (!message.Token) return new Response(null, { status: 400 });
      await confirmBrowserTopic(message.Token);
    } else {
      await processBrowserEvent(JSON.parse(message.Message));
    }
    return new Response(null, { status: 204 });
  } catch {
    console.warn(JSON.stringify({ event: "marketplace_browser.event_failed" }));
    // Retry delivery on transient AWS/DB failures; never acknowledge unprocessed changes.
    return new Response(null, { status: 503 });
  }
}
