"use client";

import { createContext, useContext, type ReactNode } from "react";

// Presentation only. Server-side workspace and allowance checks remain authoritative.
const BrowserMarketplaceScope = createContext(false);

export function BrowserMarketplaceProvider({ children }: { children: ReactNode }) {
  return <BrowserMarketplaceScope.Provider value={true}>{children}</BrowserMarketplaceScope.Provider>;
}

export function useBrowserMarketplaceScope() {
  return useContext(BrowserMarketplaceScope);
}
