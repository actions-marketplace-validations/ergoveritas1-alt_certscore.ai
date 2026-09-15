export function classifyUserAgent(userAgent: string) {
  const lower = userAgent.toLowerCase();
  const isBot = /bot|crawler|spider|headless|lighthouse|synthetic/.test(lower);
  const browserFamily = lower.includes("edg/") ? "edge" : lower.includes("firefox/") ? "firefox" : lower.includes("chrome/") ? "chrome" : lower.includes("safari/") ? "safari" : "other";
  const osFamily = lower.includes("iphone") || lower.includes("ipad") ? "ios" : lower.includes("android") ? "android" : lower.includes("mac os") ? "macos" : lower.includes("windows") ? "windows" : lower.includes("linux") ? "linux" : "other";
  const deviceClass = lower.includes("ipad") || lower.includes("tablet") ? "tablet" : lower.includes("mobile") || lower.includes("iphone") || lower.includes("android") ? "mobile" : userAgent ? "desktop" : "unknown";
  return { browserFamily, deviceClass: deviceClass as "desktop" | "mobile" | "tablet" | "unknown", isBot, osFamily };
}

export function requestTechnicalContext(headers: Headers) {
  const country = headers.get("cloudfront-viewer-country") ?? headers.get("cf-ipcountry");
  const language = headers.get("accept-language")?.split(/[,;]/, 1)[0]?.trim();
  return {
    ...classifyUserAgent(headers.get("user-agent") ?? ""),
    countryCode: country && /^[A-Z]{2}$/.test(country) ? country : null,
    language: language && /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language) ? language : undefined,
  };
}
