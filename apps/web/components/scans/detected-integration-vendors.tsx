"use client";
import { createContext, useContext } from "react";
import { VendorBrandChip } from "./vendor-brand-chip";

/** Scoped inventory names supplement the starting-page projection; never findings. */
export const DetectedIntegrationInventoryContext = createContext<string[] | undefined>(undefined);
const key = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();
export function DetectedIntegrationVendors({ vendors, inventoryNames }: {
  vendors: Array<{ name: string; purpose?: string }>;
  inventoryNames?: string[];
}) {
  const siteNames = useContext(DetectedIntegrationInventoryContext);
  const seen = new Set(vendors.map(vendor => key(vendor.name)));
  const additional = (siteNames ?? inventoryNames ?? []).filter(name => {
    if (!name.trim() || seen.has(key(name))) return false;
    seen.add(key(name)); return true;
  });
  return <div role="region" aria-label="Detected integration vendors" tabIndex={0} className="mt-3 max-h-48 overflow-y-auto overscroll-contain rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600">
    <div className="flex flex-wrap gap-2">{vendors.map(vendor => <VendorBrandChip key={vendor.name} label={vendor.name} category={vendor.purpose} showMeta={Boolean(vendor.purpose)} />)}</div>
    {additional.length ? <>
      <p className="mb-2 mt-3 text-[11px] font-medium text-slate-500">Other services · scanned inventory</p>
      <div className="flex flex-wrap gap-2">{additional.map(name => <VendorBrandChip key={name} label={name} showMeta={false} />)}</div>
    </> : null}
  </div>;
}
