"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

export type InventoryResourceKind = "all" | "request" | "cookie" | "embed";
type InventoryView = "services" | "resources";
const InventoryNavigation = createContext<{
  view: InventoryView;
  setView: (view: InventoryView) => void;
  kind: InventoryResourceKind;
  setKind: (kind: InventoryResourceKind) => void;
  navigate: (view: InventoryView, kind?: InventoryResourceKind) => void;
} | null>(null);

/** Shared UI state for the overview links and the inventory table below it. */
export function ReportInventoryNavigation({ children }: { children: ReactNode }) {
  const [view, setView] = useState<InventoryView>("services");
  const [kind, setKind] = useState<InventoryResourceKind>("all");
  const navigate = (next: InventoryView, nextKind: InventoryResourceKind = "all") => {
    setKind(nextKind);
    setView(next);
    document.getElementById("report-resource-inventory")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return <InventoryNavigation.Provider value={{view, setView, kind, setKind, navigate}}>{children}</InventoryNavigation.Provider>;
}
export const useReportInventoryNavigation = () => useContext(InventoryNavigation);
