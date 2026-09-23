export type ConsentActionLabelFields = {
  ariaLabel?: string;
  title?: string;
  value?: string;
  visibleText?: string;
};

/** Browser-serializable read shared by discovery and final action proof.
 * Button values are submission payloads; only button-like inputs render values
 * as labels. Keep this callback self-contained for Playwright serialization.
 */
export function readConsentActionLabelFields(element: Element): ConsentActionLabelFields {
  const html = element as HTMLElement;
  return {
    ariaLabel: element.getAttribute("aria-label") ?? undefined,
    title: element.getAttribute("title") ?? undefined,
    value: element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)
      ? element.value : undefined,
    visibleText: html.innerText || element.textContent || undefined,
  };
}
